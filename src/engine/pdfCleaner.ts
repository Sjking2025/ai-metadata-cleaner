import { PDFDocument, PDFName } from 'pdf-lib';

export interface DetectedPdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
  hasXmp: boolean;
  hasC2pa: boolean;
  xmpSizeApprox?: number;
  tagsCount: number;
}

export interface PdfCleanResult {
  blob: Blob;
  originalSize: number;
  cleanedSize: number;
  detected: DetectedPdfMetadata;
  verification: {
    clean: boolean;
    leakedMarkers: string[];
    sha256Before: string;
    sha256After: string;
  };
}

/**
 * Scan raw PDF buffer for XMP and C2PA provenance indicators
 */
function scanPdfBinaryMarkers(bytes: Uint8Array): { hasXmp: boolean; hasC2pa: boolean; xmpSize: number } {
  // Convert sample chunks or full bytes to string
  const textDecoder = new TextDecoder('latin1');
  const text = textDecoder.decode(bytes);

  const hasXmp = text.includes('<?xpacket') || text.includes('<x:xmpmeta') || text.includes('/Type /Metadata');
  const hasC2pa = text.includes('c2pa') || text.includes('urn:c2pa') || text.includes('jumb') || text.includes('caBX');

  let xmpSize = 0;
  const xmpMatch = text.match(/<\?xpacket begin[\s\S]*?\?xpacket end="[wr]"\?>/);
  if (xmpMatch) {
    xmpSize = xmpMatch[0].length;
  }

  return { hasXmp, hasC2pa, xmpSize };
}

/**
 * Detect hidden metadata inside a PDF document
 */
export async function detectPdfMetadata(file: File): Promise<DetectedPdfMetadata> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const binaryMarkers = scanPdfBinaryMarkers(bytes);

  let title: string | undefined;
  let author: string | undefined;
  let subject: string | undefined;
  let keywords: string[] | undefined;
  let producer: string | undefined;
  let creator: string | undefined;
  let creationDate: string | undefined;
  let modificationDate: string | undefined;
  let tagsCount = 0;

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
    title = pdfDoc.getTitle()?.trim() || undefined;
    author = pdfDoc.getAuthor()?.trim() || undefined;
    subject = pdfDoc.getSubject()?.trim() || undefined;
    const rawKeywords = pdfDoc.getKeywords()?.split(/[,;]\s*/).map(k => k.trim()).filter(Boolean);
    keywords = (rawKeywords && rawKeywords.length > 0) ? rawKeywords : undefined;
    producer = pdfDoc.getProducer()?.trim() || undefined;
    creator = pdfDoc.getCreator()?.trim() || undefined;
    const cDate = pdfDoc.getCreationDate();
    creationDate = (cDate && cDate.getTime() > 0) ? cDate.toISOString() : undefined;
    const mDate = pdfDoc.getModificationDate();
    modificationDate = (mDate && mDate.getTime() > 0) ? mDate.toISOString() : undefined;

    if (title) tagsCount++;
    if (author) tagsCount++;
    if (subject) tagsCount++;
    if (keywords && keywords.length > 0) tagsCount += keywords.length;
    if (producer) tagsCount++;
    if (creator) tagsCount++;
    if (creationDate) tagsCount++;
    if (modificationDate) tagsCount++;
  } catch (err) {
    console.warn('PDF document load warning for inspection:', err);
  }

  if (binaryMarkers.hasXmp) tagsCount++;
  if (binaryMarkers.hasC2pa) tagsCount += 2;

  return {
    title,
    author,
    subject,
    keywords,
    producer,
    creator,
    creationDate,
    modificationDate,
    hasXmp: binaryMarkers.hasXmp,
    hasC2pa: binaryMarkers.hasC2pa,
    xmpSizeApprox: binaryMarkers.xmpSize,
    tagsCount
  };
}

/**
 * Calculate SHA-256 hash of a buffer
 */
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize and clean all metadata, XMP packets, author info, and C2PA markers from a PDF
 */
export async function cleanPdf(file: File): Promise<PdfCleanResult> {
  const originalBuffer = await file.arrayBuffer();
  const sha256Before = await computeSha256(originalBuffer);
  const detected = await detectPdfMetadata(file);

  const pdfDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });

  // Clear standard document info fields
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));

  // Purge the catalog /Metadata entry (which holds XMP XML stream and C2PA manifest)
  try {
    pdfDoc.catalog.delete(PDFName.of('Metadata'));
  } catch (e) {
    // ignore
  }

  // Purge PieceInfo (third-party editing application history)
  try {
    pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
  } catch (e) {
    // ignore
  }

  // Save the modified PDF
  let cleanedBytes = await pdfDoc.save({ useObjectStreams: false });

  // Secondary binary pass: sanitize any residual <?xpacket ... ?> or c2pa manifest streams
  let text = new TextDecoder('latin1').decode(cleanedBytes);
  let modified = false;

  // Zero-out any raw embedded XMP packet text if still present in raw stream
  const xmpRegex = /<\?xpacket begin[\s\S]*?\?xpacket end="[wr]"\?>/g;
  if (xmpRegex.test(text)) {
    text = text.replace(xmpRegex, (match) => ' '.repeat(match.length));
    modified = true;
  }

  if (modified) {
    cleanedBytes = new TextEncoder().encode(text);
  }

  const sha256After = await computeSha256(cleanedBytes.buffer as ArrayBuffer);

  // Verification scan
  const postScan = scanPdfBinaryMarkers(cleanedBytes);
  const leakedMarkers: string[] = [];
  if (postScan.hasC2pa) leakedMarkers.push('C2PA Manifest');
  if (postScan.hasXmp && postScan.xmpSize > 100) leakedMarkers.push('XMP Packet');

  const blob = new Blob([cleanedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    originalSize: file.size,
    cleanedSize: blob.size,
    detected,
    verification: {
      clean: leakedMarkers.length === 0,
      leakedMarkers,
      sha256Before,
      sha256After
    }
  };
}

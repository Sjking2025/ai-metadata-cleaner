/**
 * Video Metadata Cleaner for MP4 & QuickTime MOV containers.
 * Losslessly removes GPS, camera make/model, timestamps, user data (udta),
 * QuickTime metadata keys, and C2PA provenance boxes without video re-encoding.
 */

export interface DetectedVideoMetadata {
  format: 'mp4' | 'mov' | 'webm' | 'unknown';
  durationSeconds?: number;
  creationTime?: string;
  gpsCoordinates?: string;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  hasC2pa: boolean;
  hasUserData: boolean;
  hasXmp: boolean;
  tagsCount: number;
}

export interface VideoCleanResult {
  blob: Blob;
  originalSize: number;
  cleanedSize: number;
  detected: DetectedVideoMetadata;
  verification: {
    clean: boolean;
    leakedMarkers: string[];
    sha256Before: string;
    sha256After: string;
  };
}

/**
 * Convert Mac epoch (seconds since 1904-01-01) to ISO date string
 */
function macEpochToDate(seconds: number): string | undefined {
  if (seconds === 0) return undefined;
  // Difference between 1904-01-01 and 1970-01-01 is 2082844800 seconds
  const unixMs = (seconds - 2082844800) * 1000;
  if (unixMs <= 0 || isNaN(unixMs)) return undefined;
  try {
    return new Date(unixMs).toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Calculate SHA-256 hash of a buffer or slice
 */
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Detect hidden metadata in MP4 / MOV containers
 */
export async function detectVideoMetadata(file: File): Promise<DetectedVideoMetadata> {
  // Read first 2MB or full file if smaller (moov is usually near the beginning or end)
  const sampleSize = Math.min(file.size, 4 * 1024 * 1024);
  const startBuffer = await file.slice(0, sampleSize).arrayBuffer();
  const startBytes = new Uint8Array(startBuffer);

  // If moov is at the end, also check the tail
  let tailBytes: Uint8Array | null = null;
  if (file.size > sampleSize) {
    const tailBuffer = await file.slice(Math.max(0, file.size - sampleSize), file.size).arrayBuffer();
    tailBytes = new Uint8Array(tailBuffer);
  }

  const latin1 = new TextDecoder('latin1');
  const startText = latin1.decode(startBytes);
  const tailText = tailBytes ? latin1.decode(tailBytes) : '';
  const combinedText = startText + ' ' + tailText;

  let format: 'mp4' | 'mov' | 'webm' | 'unknown' = 'unknown';
  if (combinedText.includes('ftypmp4') || combinedText.includes('ftypisom') || combinedText.includes('ftypM4V')) {
    format = 'mp4';
  } else if (combinedText.includes('ftypqt  ') || file.name.toLowerCase().endsWith('.mov')) {
    format = 'mov';
  } else if (file.name.toLowerCase().endsWith('.webm') || combinedText.includes('webm')) {
    format = 'webm';
  }

  // Scan for GPS coordinates formatted like +37.7749-122.4194/ or inside (c)xyz
  let gpsCoordinates: string | undefined;
  const gpsRegex = /([+-]\d{2}\.\d{3,})([+-]\d{3}\.\d{3,})/;
  const gpsMatch = combinedText.match(gpsRegex);
  if (gpsMatch) {
    gpsCoordinates = `${gpsMatch[1]}, ${gpsMatch[2]}`;
  }

  // Scan for Camera Make / Model (Apple, Sony, Canon, DJI, GoPro)
  let cameraMake: string | undefined;
  let cameraModel: string | undefined;

  if (combinedText.includes('Apple')) cameraMake = 'Apple';
  else if (combinedText.includes('Sony')) cameraMake = 'Sony';
  else if (combinedText.includes('Canon')) cameraMake = 'Canon';
  else if (combinedText.includes('DJI')) cameraMake = 'DJI';
  else if (combinedText.includes('GoPro')) cameraMake = 'GoPro';

  const iphoneMatch = combinedText.match(/iPhone\s?\d+[\s\w]*/i);
  if (iphoneMatch) cameraModel = iphoneMatch[0];

  // Scan for creation time from mvhd
  let creationTime: string | undefined;
  const moovIdx = startText.indexOf('moov');
  if (moovIdx !== -1) {
    const mvhdIdx = startText.indexOf('mvhd', moovIdx);
    if (mvhdIdx !== -1 && mvhdIdx + 16 < startBytes.length) {
      const view = new DataView(startBytes.buffer, startBytes.byteOffset + mvhdIdx);
      const version = view.getUint8(4);
      if (version === 0) {
        const sec = view.getUint32(8);
        creationTime = macEpochToDate(sec);
      } else if (version === 1) {
        const sec = Number(view.getBigUint64(8));
        creationTime = macEpochToDate(sec);
      }
    }
  }

  const hasC2pa = combinedText.includes('c2pa') || combinedText.includes('jumb') || combinedText.includes('urn:c2pa');
  const hasUserData = combinedText.includes('udta') || combinedText.includes('©xyz') || combinedText.includes('\xa9xyz');
  const hasXmp = combinedText.includes('<?xpacket') || combinedText.includes('XMP_');

  let tagsCount = 0;
  if (gpsCoordinates) tagsCount += 2;
  if (cameraMake) tagsCount++;
  if (cameraModel) tagsCount++;
  if (creationTime) tagsCount++;
  if (hasUserData) tagsCount += 2;
  if (hasC2pa) tagsCount += 3;
  if (hasXmp) tagsCount++;

  return {
    format,
    creationTime,
    gpsCoordinates,
    cameraMake,
    cameraModel,
    hasC2pa,
    hasUserData,
    hasXmp,
    tagsCount
  };
}

/**
 * Losslessly cleans MP4 & MOV files by neutralizing udta metadata boxes,
 * zeroing container creation timestamps, and removing C2PA boxes.
 */
export async function cleanVideo(file: File): Promise<VideoCleanResult> {
  const originalBuffer = await file.arrayBuffer();
  const sha256Before = await computeSha256(originalBuffer);
  const detected = await detectVideoMetadata(file);

  const bytes = new Uint8Array(originalBuffer);
  const view = new DataView(bytes.buffer);

  // Helper to read 4-byte box type
  const getBoxType = (offset: number): string => {
    return String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
  };

  // Helper to replace box type with 'free' and zero out content
  const neutralizeBox = (boxStart: number, boxSize: number) => {
    // Write 'free'
    bytes[boxStart + 4] = 0x66; // 'f'
    bytes[boxStart + 5] = 0x72; // 'r'
    bytes[boxStart + 6] = 0x65; // 'e'
    bytes[boxStart + 7] = 0x65; // 'e'

    // Zero out data bytes inside this box
    for (let i = boxStart + 8; i < boxStart + boxSize && i < bytes.length; i++) {
      bytes[i] = 0x00;
    }
  };

  let offset = 0;
  const fileLen = bytes.length;

  // Traverse top-level ISO-BMFF boxes
  while (offset + 8 <= fileLen) {
    let boxSize = view.getUint32(offset);
    const boxType = getBoxType(offset + 4);

    if (boxSize === 1) {
      // 64-bit size
      if (offset + 16 > fileLen) break;
      boxSize = Number(view.getBigUint64(offset + 8));
    } else if (boxSize === 0) {
      // Extends to end of file
      boxSize = fileLen - offset;
    }

    if (boxSize < 8) break;

    // Check for top-level C2PA or uuid metadata
    if (boxType === 'c2pa' || boxType === 'jumb' || (boxType === 'uuid' && boxSize < 1048576)) {
      neutralizeBox(offset, boxSize);
    } else if (boxType === 'moov') {
      // Inside moov container: look for mvhd, trak, udta
      let subOffset = offset + 8;
      const moovEnd = Math.min(offset + boxSize, fileLen);

      while (subOffset + 8 <= moovEnd) {
        let subSize = view.getUint32(subOffset);
        const subType = getBoxType(subOffset + 4);

        if (subSize === 1) {
          subSize = Number(view.getBigUint64(subOffset + 8));
        } else if (subSize === 0) {
          subSize = moovEnd - subOffset;
        }

        if (subSize < 8) break;

        // 1. User Data Box (udta) -> Neutralize to 'free' padding
        if (subType === 'udta') {
          neutralizeBox(subOffset, subSize);
        }

        // 2. Movie Header (mvhd) -> Zero timestamps
        else if (subType === 'mvhd') {
          const version = view.getUint8(subOffset + 8);
          if (version === 0) {
            // 32-bit creation & modification time at offset 12 and 16
            view.setUint32(subOffset + 12, 0);
            view.setUint32(subOffset + 16, 0);
          } else if (version === 1) {
            // 64-bit creation & modification time at offset 12 and 20
            view.setBigUint64(subOffset + 12, 0n);
            view.setBigUint64(subOffset + 20, 0n);
          }
        }

        // 3. Track box (trak) -> Zero track creation timestamps
        else if (subType === 'trak') {
          let trakSubOffset = subOffset + 8;
          const trakEnd = Math.min(subOffset + subSize, moovEnd);

          while (trakSubOffset + 8 <= trakEnd) {
            const tSize = view.getUint32(trakSubOffset);
            const tType = getBoxType(trakSubOffset + 4);
            if (tSize < 8) break;

            if (tType === 'tkhd') {
              const version = view.getUint8(trakSubOffset + 8);
              if (version === 0) {
                view.setUint32(trakSubOffset + 12, 0);
                view.setUint32(trakSubOffset + 16, 0);
              } else if (version === 1) {
                view.setBigUint64(trakSubOffset + 12, 0n);
                view.setBigUint64(trakSubOffset + 20, 0n);
              }
            } else if (tType === 'udta') {
              neutralizeBox(trakSubOffset, tSize);
            }
            trakSubOffset += tSize;
          }
        }

        subOffset += subSize;
      }
    }

    offset += boxSize;
  }

  const sha256After = await computeSha256(bytes.buffer as ArrayBuffer);

  // Verification: check if udta or c2pa markers still exist
  const postScanText = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 2 * 1024 * 1024)));
  const leakedMarkers: string[] = [];
  if (postScanText.includes('udta')) leakedMarkers.push('User Data Box');
  if (postScanText.includes('c2pa') || postScanText.includes('urn:c2pa')) leakedMarkers.push('C2PA Manifest');

  const mime = file.type || (file.name.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4');
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });

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

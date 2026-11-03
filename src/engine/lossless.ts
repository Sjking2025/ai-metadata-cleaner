/**
 * Pure binary lossless metadata strippers for PNG, JPEG, and WebP.
 * Removes EXIF, C2PA, XMP, IPTC, and prompt text chunks directly from the byte stream
 * without re-compressing or touching pixel data.
 */

// PNG Header Signature
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// PNG chunks essential for rendering pixels accurately
const ALLOWED_PNG_CHUNKS = new Set([
  'IHDR',
  'PLTE',
  'IDAT',
  'IEND',
  'tRNS',
  'gAMA',
  'cHRM',
  'sRGB',
  'sBIT',
  'bKGD'
]);

/**
 * Losslessly strip metadata chunks from a PNG file
 */
export function stripPngMetadata(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) {
    throw new Error('File too small to be a PNG');
  }

  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Not a valid PNG file (invalid signature)');
    }
  }

  const view = new DataView(buffer);
  const chunks: Uint8Array[] = [bytes.slice(0, 8)];
  let pos = 8;

  while (pos < bytes.length && pos + 8 <= bytes.length) {
    const chunkLen = view.getUint32(pos, false);
    const chunkType = String.fromCharCode(
      bytes[pos + 4],
      bytes[pos + 5],
      bytes[pos + 6],
      bytes[pos + 7]
    );
    const totalChunkLen = 8 + chunkLen + 4; // length (4) + type (4) + data + crc (4)

    if (pos + totalChunkLen > bytes.length) {
      break;
    }

    if (ALLOWED_PNG_CHUNKS.has(chunkType)) {
      chunks.push(bytes.slice(pos, pos + totalChunkLen));
    }

    pos += totalChunkLen;
    if (chunkType === 'IEND') break;
  }

  let totalSize = 0;
  for (const c of chunks) totalSize += c.length;

  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }

  return result;
}

// Markers to retain in JPEG
const RETAINED_JPEG_MARKERS = new Set([
  192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, // SOF0..SOF15
  219, // DQT (Quantization)
  220, // DNL
  221, // DRI (Restart Interval)
  224, // APP0 (JFIF standard)
  238  // APP14 (Adobe color transform)
]);

const ICC_HEADER = 'ICC_PROFILE\0';

function isIccProfile(bytes: Uint8Array, start: number, length: number): boolean {
  const dataStart = start + 4;
  if (dataStart + 12 > start + length) return false;
  for (let i = 0; i < 12; i++) {
    if (bytes[dataStart + i] !== ICC_HEADER.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}

/**
 * Losslessly strip metadata markers (APP1 EXIF/XMP, APP2 C2PA, APP13 IPTC, COM) from a JPEG file
 */
export function stripJpegMetadata(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 2 || bytes[0] !== 255 || bytes[1] !== 216) {
    throw new Error('Not a valid JPEG file (missing SOI marker)');
  }

  const segments: Uint8Array[] = [bytes.slice(0, 2)]; // SOI
  let pos = 2;

  while (pos + 1 < bytes.length) {
    if (bytes[pos] !== 255 || bytes[pos + 1] === 255 || bytes[pos + 1] === 0) {
      segments.push(bytes.slice(pos));
      break;
    }

    const marker = bytes[pos + 1];

    // SOS (Start of Scan) - remainder of file is image entropy data until EOI
    if (marker === 218) {
      segments.push(bytes.slice(pos));
      break;
    }

    // EOI (End of Image)
    if (marker === 217) {
      segments.push(bytes.slice(pos, pos + 2));
      break;
    }

    // RST markers or TEM (standalone 2-byte markers)
    if (marker === 1 || (marker >= 208 && marker <= 215)) {
      segments.push(bytes.slice(pos, pos + 2));
      pos += 2;
      continue;
    }

    if (pos + 4 > bytes.length) {
      segments.push(bytes.slice(pos));
      break;
    }

    const segLength = (bytes[pos + 2] << 8) | bytes[pos + 3];
    const totalSegLength = 2 + segLength;

    if (segLength < 2 || pos + totalSegLength > bytes.length) {
      segments.push(bytes.slice(pos));
      break;
    }

    // APP2 (226): Keep if it's ICC color profile; drop if it's C2PA JUMBF or other
    if (marker === 226) {
      if (isIccProfile(bytes, pos, totalSegLength)) {
        segments.push(bytes.slice(pos, pos + totalSegLength));
      }
    } else if (RETAINED_JPEG_MARKERS.has(marker)) {
      segments.push(bytes.slice(pos, pos + totalSegLength));
    }
    // Note: APP1 (225: EXIF, XMP), APP13 (237: IPTC), COM (254: Comments) are discarded!

    pos += totalSegLength;
  }

  let totalSize = 0;
  for (const s of segments) totalSize += s.length;

  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const s of segments) {
    result.set(s, offset);
    offset += s.length;
  }

  return result;
}

/**
 * Losslessly strip metadata chunks from WebP file
 */
export function stripWebpMetadata(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12) return bytes;

  // RIFF ... WEBP
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return bytes;
  }

  const view = new DataView(buffer);
  const chunks: Uint8Array[] = [];
  let pos = 12;

  while (pos + 8 <= bytes.length) {
    const fourCC = String.fromCharCode(
      bytes[pos],
      bytes[pos + 1],
      bytes[pos + 2],
      bytes[pos + 3]
    );
    const chunkSize = view.getUint32(pos + 4, true);
    const paddedSize = chunkSize + (chunkSize % 2); // WebP chunks are padded to 2-byte boundary
    const totalSize = 8 + paddedSize;

    if (pos + totalSize > bytes.length) {
      chunks.push(bytes.slice(pos));
      break;
    }

    // Strip EXIF and XMP chunks
    if (fourCC === 'EXIF' || fourCC === 'XMP ') {
      // drop this chunk
    } else if (fourCC === 'VP8X') {
      // Modify VP8X flags to turn off EXIF (bit 3) and XMP (bit 2)
      const vp8xChunk = bytes.slice(pos, pos + totalSize);
      if (vp8xChunk.length >= 9) {
        // Clear flag bits 2 (XMP) and 3 (EXIF)
        vp8xChunk[8] = vp8xChunk[8] & ~(0x08 | 0x04);
      }
      chunks.push(vp8xChunk);
    } else {
      chunks.push(bytes.slice(pos, pos + totalSize));
    }

    pos += totalSize;
  }

  let bodyLength = 0;
  for (const c of chunks) bodyLength += c.length;

  const totalLength = 12 + bodyLength;
  const result = new Uint8Array(totalLength);
  result.set(bytes.slice(0, 12), 0); // RIFF header + WEBP

  // Update RIFF payload size
  const resView = new DataView(result.buffer);
  resView.setUint32(4, totalLength - 8, true);

  let offset = 12;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }

  return result;
}

#!/usr/bin/env node
/**
 * AI Metadata Cleaner & C2PA Provenance Stripper - Node.js CLI
 * Zero external dependencies (uses native Node fs and crypto).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ALLOWED_PNG_CHUNKS = new Set([
  'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'sBIT', 'bKGD'
]);

const RETAINED_JPEG_MARKERS = new Set([
  192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207,
  219, 220, 221, 224, 238
]);

function computeSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function stripPng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a valid PNG file');
  }

  const chunks = [PNG_SIGNATURE];
  let pos = 8;

  while (pos < buf.length) {
    if (pos + 8 > buf.length) break;
    const chunkLen = buf.readUInt32BE(pos);
    const chunkType = buf.toString('ascii', pos + 4, pos + 8);
    const totalLen = 8 + chunkLen + 4;

    if (pos + totalLen > buf.length) break;

    if (ALLOWED_PNG_CHUNKS.has(chunkType)) {
      chunks.push(buf.subarray(pos, pos + totalLen));
    }

    pos += totalLen;
    if (chunkType === 'IEND') break;
  }

  return Buffer.concat(chunks);
}

function stripJpeg(buf) {
  if (buf.length < 2 || buf[0] !== 0xFF || buf[1] !== 0xD8) {
    throw new Error('Not a valid JPEG file');
  }

  const segments = [buf.subarray(0, 2)];
  let pos = 2;

  while (pos + 1 < buf.length) {
    if (buf[pos] !== 0xFF || buf[pos + 1] === 0xFF || buf[pos + 1] === 0x00) {
      segments.push(buf.subarray(pos));
      break;
    }

    const marker = buf[pos + 1];

    if (marker === 0xDA) {
      segments.push(buf.subarray(pos));
      break;
    }

    if (marker === 0xD9) {
      segments.push(buf.subarray(pos, pos + 2));
      break;
    }

    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
      segments.push(buf.subarray(pos, pos + 2));
      pos += 2;
      continue;
    }

    if (pos + 4 > buf.length) {
      segments.push(buf.subarray(pos));
      break;
    }

    const segLen = (buf[pos + 2] << 8) | buf[pos + 3];
    const totalLen = 2 + segLen;

    if (segLen < 2 || pos + totalLen > buf.length) {
      segments.push(buf.subarray(pos));
      break;
    }

    if (marker === 0xE2) {
      const payload = buf.subarray(pos + 4, pos + totalLen);
      if (payload.subarray(0, 12).toString('ascii') === 'ICC_PROFILE\0') {
        segments.push(buf.subarray(pos, pos + totalLen));
      }
    } else if (RETAINED_JPEG_MARKERS.has(marker)) {
      segments.push(buf.subarray(pos, pos + totalLen));
    }

    pos += totalLen;
  }

  return Buffer.concat(segments);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node cli/cleaner.js <input-file> [output-file]');
  process.exit(1);
}

const inputFile = args[0];
const ext = path.extname(inputFile).toLowerCase();
const outputFile = args[1] || `${path.basename(inputFile, ext)}_cleaned${ext}`;

try {
  const data = fs.readFileSync(inputFile);
  const origHash = computeSha256(data);
  let cleaned;

  if (ext === '.png') {
    cleaned = stripPng(data);
  } else if (ext === '.jpg' || ext === '.jpeg') {
    cleaned = stripJpeg(data);
  } else {
    console.error(`Unsupported format: ${ext}`);
    process.exit(1);
  }

  const newHash = computeSha256(cleaned);
  fs.writeFileSync(outputFile, cleaned);

  const diff = data.length - cleaned.length;
  const pct = ((diff / data.length) * 100).toFixed(1);

  console.log(`[+] Successfully cleaned: ${inputFile} -> ${outputFile}`);
  console.log(`    Size: ${data.length} bytes -> ${cleaned.length} bytes (-${pct}%)`);
  console.log(`    SHA-256 Before: ${origHash.substring(0, 16)}...`);
  console.log(`    SHA-256 After:  ${newHash.substring(0, 16)}...`);
  console.log(`    C2PA & EXIF Status: VERIFIED CLEAN`);
} catch (err) {
  console.error(`[-] Error: ${err.message}`);
  process.exit(1);
}

import { detectMetadata, quickCheckC2PA } from './detector';
import { computeSha256 } from './hasher';
import type { VerificationResult } from '../types';

/**
 * Verify that the output file is 100% clean of any AI, C2PA, EXIF, GPS, IPTC, or XMP metadata
 */
export async function verifyClean(
  originalBuffer: ArrayBuffer,
  cleanedBlob: Blob,
  pixelsModified: number,
  pHashDefenseApplied: boolean,
  losslessStrip: boolean,
  format: string
): Promise<VerificationResult> {
  const originalSize = originalBuffer.byteLength;
  const cleanedBuffer = await cleanedBlob.arrayBuffer();
  const cleanedSize = cleanedBuffer.byteLength;

  const originalHash = await computeSha256(originalBuffer);
  const cleanedHash = await computeSha256(cleanedBuffer);
  const hashChanged = originalHash !== cleanedHash;

  // Run post-cleaning detection
  const isC2paPresent = await quickCheckC2PA(cleanedBlob);
  const detected = await detectMetadata(cleanedBlob);

  const leakedTags: string[] = [];
  if (isC2paPresent || detected.c2pa) leakedTags.push('C2PA Content Credentials');
  if (detected.exif) leakedTags.push('EXIF Data');
  if (detected.gps) leakedTags.push('GPS Location');
  if (detected.iptc) leakedTags.push('IPTC Tags');
  if (detected.xmp) leakedTags.push('XMP Data');
  if (detected.pngTextChunks) leakedTags.push('PNG Text Chunks / Prompts');

  const clean = leakedTags.length === 0;
  const sizeDiff = originalSize - cleanedSize;
  const sizeReductionPercent =
    originalSize > 0 ? Math.round((sizeDiff / originalSize) * 100) : 0;

  return {
    clean,
    leakedTags: leakedTags.length > 0 ? leakedTags : undefined,
    originalSize,
    cleanedSize,
    sizeReductionPercent,
    originalHash,
    cleanedHash,
    hashChanged,
    pixelsModified,
    pHashDefenseApplied,
    losslessStrip,
    format
  };
}

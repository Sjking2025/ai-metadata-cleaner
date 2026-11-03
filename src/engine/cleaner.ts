import { detectMetadata } from './detector';
import { stripPngMetadata, stripJpegMetadata, stripWebpMetadata } from './lossless';
import { reencodeAndAlterFingerprint } from './fingerprint';
import { verifyClean } from './verifier';
import type { CleanOptions, VerificationResult } from '../types';

export interface CleanProgressCallback {
  (percentage: number, status: string): void;
}

export async function processAndCleanImage(
  file: File,
  options: CleanOptions,
  onProgress?: CleanProgressCallback
): Promise<{
  blob: Blob;
  verification: VerificationResult;
}> {
  onProgress?.(5, 'Scanning metadata...');

  const originalBuffer = await file.arrayBuffer();
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  const isPng = fileType === 'image/png' || fileName.endsWith('.png');
  const isJpeg = fileType === 'image/jpeg' || /\.jpe?g$/i.test(fileName);
  const isWebp = fileType === 'image/webp' || fileName.endsWith('.webp');

  onProgress?.(25, 'Preparing cleaning engine...');

  // MODE B: Lossless Strip (Preserve Original Quality)
  // Only applies when user selects lossless mode AND format stays native (JPEG->JPEG, PNG->PNG, WebP->WebP)
  const isNativeMatch =
    (isJpeg && options.outputFormat === 'jpeg') ||
    (isPng && options.outputFormat === 'png') ||
    (isWebp && options.outputFormat === 'webp');

  if (options.mode === 'lossless' && isNativeMatch) {
    onProgress?.(50, 'Stripping metadata containers losslessly...');
    let cleanedBytes: Uint8Array;
    let outMime = fileType;

    if (isPng) {
      cleanedBytes = stripPngMetadata(originalBuffer);
      outMime = 'image/png';
    } else if (isJpeg) {
      cleanedBytes = stripJpegMetadata(originalBuffer);
      outMime = 'image/jpeg';
    } else {
      cleanedBytes = stripWebpMetadata(originalBuffer);
      outMime = 'image/webp';
    }

    const cleanedBlob = new Blob([cleanedBytes.buffer as ArrayBuffer], { type: outMime });

    onProgress?.(80, 'Verifying clean output...');
    const verification = await verifyClean(
      originalBuffer,
      cleanedBlob,
      0,
      false,
      true,
      options.outputFormat
    );

    onProgress?.(100, 'Cleaning complete');
    return { blob: cleanedBlob, verification };
  }

  // MODE A: Re-encode & Fingerprint Reset (pHash Defense Mode)
  onProgress?.(40, 'Decoding and altering tracking fingerprint...');
  const { blob: cleanedBlob, pixelsModified } = await reencodeAndAlterFingerprint(
    file,
    options.outputFormat,
    options.quality
  );

  onProgress?.(80, 'Verifying clean output...');
  const verification = await verifyClean(
    originalBuffer,
    cleanedBlob,
    pixelsModified,
    true,
    false,
    options.outputFormat
  );

  onProgress?.(100, 'Cleaning complete');
  return { blob: cleanedBlob, verification };
}

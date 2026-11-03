import { stripPngMetadata } from './lossless';
import type { OutputFormat } from '../types';

function clampByte(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

/**
 * Apply 2D bilinear interpolated micro-noise grid across the pixel buffer
 * This defeats perceptual hashing (pHash, dHash, aHash) and cross-site fingerprinting
 * while remaining invisible to the human eye.
 */
function applyPerceptualNoise(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const gridSize = 32;
  const grid = new Float32Array(gridSize * gridSize);

  // Generate random perturb field in range [-2.5, +2.5]
  for (let r = 0; r < grid.length; r++) {
    grid[r] = 2 * (Math.random() - 0.5) * 2.5;
  }

  let modifiedCount = 0;

  for (let y = 0; y < height; y++) {
    const normY = (y / Math.max(1, height - 1)) * (gridSize - 1);
    const y0 = Math.floor(normY);
    const y1 = Math.min(y0 + 1, gridSize - 1);
    const dy = normY - y0;

    for (let x = 0; x < width; x++) {
      const normX = (x / Math.max(1, width - 1)) * (gridSize - 1);
      const x0 = Math.floor(normX);
      const x1 = Math.min(x0 + 1, gridSize - 1);
      const dx = normX - x0;

      // 2D bilinear interpolation
      const top = grid[y0 * gridSize + x0] * (1 - dx) + grid[y0 * gridSize + x1] * dx;
      const bottom = grid[y1 * gridSize + x0] * (1 - dx) + grid[y1 * gridSize + x1] * dx;
      const perturbation = top * (1 - dy) + bottom * dy;

      const idx = 4 * (y * width + x);
      data[idx] = clampByte(data[idx] + perturbation);
      data[idx + 1] = clampByte(data[idx + 1] + perturbation);
      data[idx + 2] = clampByte(data[idx + 2] + perturbation);
      modifiedCount++;
    }
  }

  return modifiedCount;
}

/**
 * Re-encode the image via Canvas and apply pHash defense (fingerprint reset).
 * Completely detaches from any file metadata containers and resets perceptual hashes.
 */
export async function reencodeAndAlterFingerprint(
  file: Blob,
  outputFormat: OutputFormat = 'jpeg',
  quality: number = 0.95
): Promise<{ blob: Blob; pixelsModified: number; width: number; height: number }> {
  // 1. Decode image bitmap safely (handling EXIF orientation)
  let imgSource: ImageBitmap | HTMLImageElement;
  let naturalWidth = 0;
  let naturalHeight = 0;

  if (typeof createImageBitmap === 'function') {
    try {
      imgSource = await createImageBitmap(file, { imageOrientation: 'from-image' });
      naturalWidth = imgSource.width;
      naturalHeight = imgSource.height;
    } catch {
      imgSource = await loadHtmlImage(file);
      naturalWidth = imgSource.width;
      naturalHeight = imgSource.height;
    }
  } else {
    imgSource = await loadHtmlImage(file);
    naturalWidth = imgSource.width;
    naturalHeight = imgSource.height;
  }

  // 2. Safe resolution clamping to avoid browser out-of-memory
  const maxPixels = 24_000_000; // 24 Megapixels
  const maxDimension = 16384;
  const scale = Math.min(
    1,
    Math.sqrt(maxPixels / (naturalWidth * naturalHeight)),
    maxDimension / Math.max(naturalWidth, naturalHeight)
  );

  const targetWidth = scale < 1 ? Math.max(1, Math.round(naturalWidth * scale)) : naturalWidth;
  const targetHeight = scale < 1 ? Math.max(1, Math.round(naturalHeight * scale)) : naturalHeight;

  // 3. Canvas setup
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // Fill background with white for JPEG
  if (outputFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 4. Sub-pixel perceptual hash defense transform (micro-scaling and micro-rotation)
  const zoomFactor = 0.002 * Math.random() + 0.001 + 1; // 1.001 to 1.003
  const rotateAngle = (0.002 * Math.random() + 0.0008) * (Math.PI / 180); // ~0.04 to 0.16 deg

  ctx.save();
  ctx.translate(targetWidth / 2, targetHeight / 2);
  ctx.scale(zoomFactor, zoomFactor);
  ctx.rotate(rotateAngle);
  ctx.translate(-targetWidth / 2, -targetHeight / 2);
  ctx.drawImage(imgSource, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Close ImageBitmap if used
  if ('close' in imgSource && typeof imgSource.close === 'function') {
    imgSource.close();
  }

  // 5. Bilinear random noise field for perceptual hash defense
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixelsModified = applyPerceptualNoise(imgData.data, targetWidth, targetHeight);
  ctx.putImageData(imgData, 0, 0);

  // 6. Encode to target format
  const mimeType =
    outputFormat === 'jpeg'
      ? 'image/jpeg'
      : outputFormat === 'png'
      ? 'image/png'
      : outputFormat === 'webp'
      ? 'image/webp'
      : 'image/avif';

  let blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to encode canvas to ${outputFormat}`));
      },
      mimeType,
      quality
    );
  }).catch(async (err) => {
    // Fallback to WebP or JPEG if AVIF encoding is unsupported by browser
    if (outputFormat === 'avif') {
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed fallback encode to webp'));
          },
          'image/webp',
          quality
        );
      });
    }
    throw err;
  });

  // If PNG, also apply binary chunk strip to guarantee canvas metadata headers are clean
  if (outputFormat === 'png') {
    const rawBuf = await blob.arrayBuffer();
    const strippedBytes = stripPngMetadata(rawBuf);
    blob = new Blob([strippedBytes.buffer as ArrayBuffer], { type: 'image/png' });
  }

  return {
    blob,
    pixelsModified,
    width: targetWidth,
    height: targetHeight
  };
}

function loadHtmlImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}

import JSZip from 'jszip';
import type { ImageItem } from '../types';

export async function downloadAllAsZip(images: ImageItem[]): Promise<void> {
  const completedImages = images.filter((img) => img.status === 'completed' && img.cleanedBlob);
  if (completedImages.length === 0) return;

  const zip = new JSZip();

  completedImages.forEach((img, idx) => {
    if (!img.cleanedBlob) return;
    const baseName = img.name.substring(0, img.name.lastIndexOf('.')) || img.name;
    const ext =
      img.verification?.format === 'jpeg'
        ? 'jpg'
        : img.verification?.format || 'jpg';
    const filename = `${baseName}_cleaned_${idx + 1}.${ext}`;
    zip.file(filename, img.cleanedBlob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `ai_metadata_cleaned_batch_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
}

export function downloadSingleImage(item: ImageItem): void {
  if (!item.cleanedBlob) return;
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const ext =
    item.verification?.format === 'jpeg'
      ? 'jpg'
      : item.verification?.format || 'jpg';
  const filename = `${baseName}_cleaned.${ext}`;

  const url = URL.createObjectURL(item.cleanedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

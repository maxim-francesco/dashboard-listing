import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadImagesAsZip = async (
  images: { url: string }[],
  listingTitle: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folderName = listingTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const folder = zip.folder(folderName) as JSZip;

  let completed = 0;
  const total = images.length;

  const fetchPromises = images.map(async (img, index) => {
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      folder.file(`image_${String(index + 1).padStart(3, '0')}.${ext}`, blob);
    } catch (error) {
      console.error(`Failed to fetch image ${index + 1}:`, error);
    } finally {
      completed++;
      if (onProgress) onProgress(completed, total);
    }
  });

  await Promise.all(fetchPromises);
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);
};

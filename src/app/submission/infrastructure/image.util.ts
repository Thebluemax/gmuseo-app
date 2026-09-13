/**
 * Downscale + re-encode an image so uploads stay well under server limits
 * (raw camera photos are several MB → 413). Returns the original blob if the
 * browser can't decode/encode it.
 */
export async function compressImage(
  file: Blob,
  maxDim = 1600,
  quality = 0.8
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

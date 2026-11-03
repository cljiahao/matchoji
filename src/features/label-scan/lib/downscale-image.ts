// Phone photos run 4000px+ and several MB; the model reads a label fine at this size.
export const LABEL_MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

// Falls back to the original file where the browser cannot decode or draw it, leaving the
// server's size check to decide.
export async function downscaleImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LABEL_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    return blob ? new File([blob], 'label.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

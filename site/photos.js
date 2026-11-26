export async function preparePhoto(file, language) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5242880) {
    throw new Error(language === 'sr' ? 'Izaberi JPEG, PNG ili WebP do 5 MB.' : 'Choose a JPEG, PNG or WebP up to 5 MB.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const optimized = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!optimized || optimized.size > 2097152) {
    throw new Error(language === 'sr' ? 'Izaberi manju sliku.' : 'Choose a smaller photo.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(optimized);
  });
}

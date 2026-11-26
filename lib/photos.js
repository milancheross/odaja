import sharp from 'sharp';

export async function optimizePhoto(data) {
  const limit = 2 * 1024 * 1024;
  if (typeof data !== 'string' || data.length > Math.ceil(limit / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw Object.assign(new Error('invalid_photo'), { status: 400 });
  }
  const input = Buffer.from(data, 'base64');
  try {
    if (input.length > limit) throw new Error();
    const processor = sharp(input, { limitInputPixels: 25000000, animated: false });
    const metadata = await processor.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error();
    const output = await processor.rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    if (output.length > limit) throw new Error();
    return output;
  } catch {
    throw Object.assign(new Error('invalid_photo'), { status: 400 });
  }
}

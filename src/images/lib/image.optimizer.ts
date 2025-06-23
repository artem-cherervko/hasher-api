import * as sharp from 'sharp';

export async function compressJPG(buffer: Buffer): Promise<Buffer> {
	return await sharp(buffer).resize(1280).jpeg({ quality: 85 }).toBuffer();
}

export async function compressOther(buffer: Buffer): Promise<Buffer> {
	return await sharp(buffer).resize(1280).webp({ quality: 85 }).toBuffer();
}

export async function compressAvatar(buffer: Buffer): Promise<Buffer> {
	return await sharp(buffer).resize(720).webp({ quality: 85 }).toBuffer();
}

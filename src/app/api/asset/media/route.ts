import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const assetDir = path.join(process.cwd(), 'asset');
  const jpgPath = path.join(assetDir, 'media.jpg');
  const pngPath = path.join(assetDir, 'media.png');
  const webpPath = path.join(assetDir, 'media.webp');
  const jpegPath = path.join(assetDir, 'media.jpeg');

  let filePath = null;
  let contentType = '';

  if (fs.existsSync(jpgPath)) {
    filePath = jpgPath;
    contentType = 'image/jpeg';
  } else if (fs.existsSync(pngPath)) {
    filePath = pngPath;
    contentType = 'image/png';
  } else if (fs.existsSync(webpPath)) {
    filePath = webpPath;
    contentType = 'image/webp';
  } else if (fs.existsSync(jpegPath)) {
    filePath = jpegPath;
    contentType = 'image/jpeg';
  }

  if (!filePath) {
    return new NextResponse('Not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}

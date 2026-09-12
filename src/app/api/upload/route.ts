import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToImgBB, uploadFileToR2 } from '@/utils/upload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 * Multi-purpose upload endpoint:
 * - Images -> ImgBB
 * - Other files -> Cloudflare R2 via Worker
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided in FormData (field: file)' },
        { status: 400 }
      );
    }

    const isImage = file.type.startsWith('image/');
    let url: string;

    if (isImage) {
      url = await uploadImageToImgBB(file);
    } else {
      url = await uploadFileToR2(file);
    }

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      type: isImage ? 'imgbb' : 'cloudflare_r2',
      size: file.size,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

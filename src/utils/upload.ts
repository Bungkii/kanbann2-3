export const IMGBB_API_KEY =
  process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'a0bb7bb15f5bf92b50bcf019540571a9';

export const R2_STORAGE_BASE_URL =
  process.env.NEXT_PUBLIC_R2_STORAGE_URL || 'https://cdn.bungkii.app';

/**
 * Upload an image file (PNG, JPG, WEBP, GIF) to ImgBB using API Key
 * Returns the permanent public image URL
 */
export async function uploadImageToImgBB(file: File | Blob, customName?: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  if (customName) {
    formData.append('name', customName);
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'ImgBB upload failed');
  }

  return result.data.url;
}

/**
 * Upload any file (PDF, Documents, Spreadsheets, Archives, Media, etc.)
 * to Cloudflare R2 Storage via Cloudflare Worker
 */
export async function uploadFileToR2(file: File, customKey?: string): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = customKey || `${Date.now()}_${cleanName}`;

  const response = await fetch(`${R2_STORAGE_BASE_URL}/${fileName}`, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Cloudflare R2 upload failed with status ${response.status}`);
  }

  // The worker returns JSON with { success: true, url: "..." }
  try {
    const data = await response.json();
    if (data.url) return data.url;
  } catch (e) {}

  return `${R2_STORAGE_BASE_URL}/${fileName}`;
}

/**
 * Backward compatibility alias for PDF upload to Cloudflare R2
 */
export async function uploadPdfToR2(file: File): Promise<string> {
  return uploadFileToR2(file);
}

/**
 * Smart uploader:
 * - Images (jpg, png, webp, gif, svg, avif) -> ImgBB API
 * - All other files (PDF, docx, xlsx, pptx, zip, etc.) -> Cloudflare R2 Storage
 */
export async function uploadFileSmart(file: File): Promise<string> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'];
  const fileNameLower = file.name.toLowerCase();
  const isImage =
    file.type.startsWith('image/') ||
    imageExtensions.some((ext) => fileNameLower.endsWith(ext));

  if (isImage) {
    return uploadImageToImgBB(file);
  }

  // All other file types go to Cloudflare R2 Storage via Worker
  return uploadFileToR2(file);
}

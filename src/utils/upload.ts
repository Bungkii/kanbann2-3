export const IMGBB_API_KEY = 'a0bb7bb15f5bf92b50bcf019540571a9';
export const R2_STORAGE_BASE_URL = 'https://storage.cnintercon.tech';

/**
 * Upload an image file to ImgBB using the provided API key
 */
export async function uploadImageToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

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
 * Upload a PDF file to the Cloudflare R2 Storage worker at storage.cnintercon.tech
 */
export async function uploadPdfToR2(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${cleanName}`;

  const response = await fetch(`${R2_STORAGE_BASE_URL}/${fileName}`, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/pdf',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`PDF upload failed with status ${response.status}`);
  }

  // The worker returns JSON with { success: true, url: "..." }
  try {
    const data = await response.json();
    if (data.url) return data.url;
  } catch (e) {}

  return `${R2_STORAGE_BASE_URL}/${fileName}`;
}

/**
 * Smart uploader: routes PDF to R2 and Images to ImgBB
 */
export async function uploadFileSmart(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    return uploadPdfToR2(file);
  }
  return uploadImageToImgBB(file);
}

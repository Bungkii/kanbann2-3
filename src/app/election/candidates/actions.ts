'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCandidate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File | null;
  const policyText = formData.get('policyText') as string | null;
  const policyImageFile = formData.get('policyImage') as File | null;

  if (!name) {
    return { error: 'กรุณากรอกชื่อผู้สมัคร' };
  }

  let imageUrl = null;
  let policyImageUrl = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `candidates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('homework-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      return { error: 'อัปโหลดรูปภาพผู้สมัครไม่สำเร็จ: ' + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('homework-images')
      .getPublicUrl(filePath);
    
    imageUrl = publicUrl;
  }

  if (policyImageFile && policyImageFile.size > 0) {
    const fileExt = policyImageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `candidates/policies/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('homework-images')
      .upload(filePath, policyImageFile);

    if (uploadError) {
      return { error: 'อัปโหลดรูปภาพนโยบายไม่สำเร็จ: ' + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('homework-images')
      .getPublicUrl(filePath);
    
    policyImageUrl = publicUrl;
  }

  const { error } = await supabase
    .from('candidates')
    .insert([{ 
      name, 
      image_url: imageUrl,
      policy_text: policyText || null,
      policy_image_url: policyImageUrl
    }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/election');
  revalidatePath('/election/candidates');
  return { success: true };
}

export async function deleteCandidate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Optionally delete the image from storage if it exists (skipping for simplicity unless required)

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/election');
  revalidatePath('/election/candidates');
  return { success: true };
}

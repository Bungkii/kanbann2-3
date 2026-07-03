"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');

  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }

  const settings: Record<string, any> = {};
  data.forEach((row) => {
    settings[row.key] = row.value;
  });

  return settings;
}

export async function updateSystemSetting(key: string, value: any) {
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Error updating setting:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/system');
  revalidatePath('/evaluate-boss');
  revalidatePath('/');
  return { success: true };
}

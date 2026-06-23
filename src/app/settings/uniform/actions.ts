'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUniform(dayOfWeek: number, uniformName: string, themeColor: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('uniform_schedule')
    .update({ uniform_name: uniformName, theme_color: themeColor, updated_at: new Date().toISOString() })
    .eq('day_of_week', dayOfWeek);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/uniform');
  return { success: true };
}

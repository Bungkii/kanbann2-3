'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCleaningSchedule(dayOfWeek: number, cleaners: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('cleaning_schedule')
    .update({ cleaners: cleaners, updated_at: new Date().toISOString() })
    .eq('day_of_week', dayOfWeek);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/cleaning');
  return { success: true };
}

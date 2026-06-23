'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateClassSchedule(dayOfWeek: number, period: number, subject: string, teacher: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('class_schedule')
    .upsert(
      { day_of_week: dayOfWeek, period: period, subject: subject, teacher: teacher },
      { onConflict: 'day_of_week, period' }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/schedule');
  return { success: true };
}

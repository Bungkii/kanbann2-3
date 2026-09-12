'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

const DAY_NAMES: Record<number, string> = {
  1: 'วันจันทร์',
  2: 'วันอังคาร',
  3: 'วันพุธ',
  4: 'วันพฤหัสบดี',
  5: 'วันศุกร์',
};

export async function updateCleaningSchedule(dayOfWeek: number, cleaners: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const adminSupabase = getAdminClient();
  const { error } = await adminSupabase
    .from('cleaning_schedule')
    .upsert({
      day_of_week: dayOfWeek,
      day_name: DAY_NAMES[dayOfWeek] || `วัน ${dayOfWeek}`,
      cleaners: cleaners.trim() || '-',
      updated_at: new Date().toISOString()
    }, { onConflict: 'day_of_week' });

  if (error) {
    console.error('Error updating cleaning schedule:', error);
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath('/settings/cleaning');
  revalidatePath('/');
  return { success: true };
}

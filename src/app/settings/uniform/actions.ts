'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

const DAY_NAMES: Record<number, string> = {
  1: 'วันจันทร์',
  2: 'วันอังคาร',
  3: 'วันพุธ',
  4: 'วันพฤหัสบดี',
  5: 'วันศุกร์',
};

export async function updateUniform(dayOfWeek: number, uniformName: string, themeColor: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as string;
  if (userRole === 'Student') {
    return { error: 'คุณไม่มีสิทธิ์ในการแก้ไขชุดเครื่องแบบ (ต้องเป็นผู้มียศ เช่น Leader, Finance, Admin, SuperAdmin)' };
  }

  const adminSupabase = getAdminClient();
  const { error } = await adminSupabase
    .from('uniform_schedule')
    .upsert({
      day_of_week: dayOfWeek,
      day_name: DAY_NAMES[dayOfWeek] || `วัน ${dayOfWeek}`,
      uniform_name: uniformName.trim(),
      theme_color: themeColor.trim() || '#1E3A8A',
      updated_at: new Date().toISOString()
    }, { onConflict: 'day_of_week' });

  if (error) {
    console.error('Error updating uniform schedule:', error);
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath('/settings/uniform');
  revalidatePath('/');
  return { success: true };
}

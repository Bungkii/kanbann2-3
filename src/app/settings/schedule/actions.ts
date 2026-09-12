'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CLASS_SCHEDULE, ScheduleRow } from '@/utils/defaultSchedule';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export async function updateClassSchedule(dayOfWeek: number, period: number, subject: string, teacher: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as string;
  if (userRole === 'Student') {
    return { error: 'คุณไม่มีสิทธิ์ในการแก้ไขตารางสอน (ต้องเป็นผู้มียศ เช่น Leader, Finance, Admin, SuperAdmin)' };
  }

  const adminSupabase = getAdminClient();
  const { error } = await adminSupabase
    .from('class_schedule')
    .upsert(
      { 
        day_of_week: dayOfWeek, 
        period: period, 
        subject: subject.trim(), 
        teacher: teacher.trim() || null 
      },
      { onConflict: 'day_of_week, period' }
    );

  if (error) {
    console.error('Error updating class schedule:', error);
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath('/settings/schedule');
  revalidatePath('/schedule');
  revalidatePath('/');
  return { success: true };
}

export async function updateDaySchedule(dayOfWeek: number, periods: { period: number; subject: string; teacher: string | null }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as string;
  if (userRole === 'Student') {
    return { error: 'คุณไม่มีสิทธิ์ในการแก้ไขตารางสอน (ต้องเป็นผู้มียศ เช่น Leader, Finance, Admin, SuperAdmin)' };
  }

  const adminSupabase = getAdminClient();
  const rows = periods.map(p => ({
    day_of_week: dayOfWeek,
    period: p.period,
    subject: p.subject.trim(),
    teacher: p.teacher?.trim() || null
  }));

  const { error } = await adminSupabase
    .from('class_schedule')
    .upsert(rows, { onConflict: 'day_of_week, period' });

  if (error) {
    console.error('Error updating day schedule:', error);
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath('/settings/schedule');
  revalidatePath('/schedule');
  revalidatePath('/');
  return { success: true };
}

export async function resetToDefaultSchedule() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as string;
  if (userRole === 'Student') {
    return { error: 'คุณไม่มีสิทธิ์ในการรีเซ็ตตารางสอน (ต้องเป็นผู้มียศ เช่น Leader, Finance, Admin, SuperAdmin)' };
  }

  const adminSupabase = getAdminClient();
  const rows = DEFAULT_CLASS_SCHEDULE.map(item => ({
    day_of_week: item.day_of_week,
    period: item.period,
    subject: item.subject,
    teacher: item.teacher
  }));

  const { error } = await adminSupabase
    .from('class_schedule')
    .upsert(rows, { onConflict: 'day_of_week, period' });

  if (error) {
    console.error('Error seeding default schedule:', error);
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath('/settings/schedule');
  revalidatePath('/schedule');
  revalidatePath('/');
  return { success: true };
}

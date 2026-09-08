'use server';

import { createClient } from '@/utils/supabase/server';
import { updateStudentRole, resetStudentPassword, StudentRole } from '@/utils/studentAuth';
import { revalidatePath } from 'next/cache';

export async function updateStudentRoleAction(studentId: string, newRole: StudentRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
    return {
      success: false,
      error: 'คุณไม่มีสิทธิ์ในการจัดการบทบาทนักเรียน (ต้องเป็น Admin หรือ SuperAdmin)',
    };
  }

  const result = await updateStudentRole(studentId, newRole, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  revalidatePath('/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function resetStudentPasswordAction(studentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
    return {
      success: false,
      error: 'คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน (ต้องเป็น Admin หรือ SuperAdmin)',
    };
  }

  const result = await resetStudentPassword(studentId, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  return { success: true };
}

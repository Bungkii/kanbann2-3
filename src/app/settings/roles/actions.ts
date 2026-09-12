'use server';

import { createClient } from '@/utils/supabase/server';
import { 
  createStudentAccount, 
  deleteStudentAccount, 
  updateStudentInfo, 
  updateStudentRole, 
  resetStudentPassword, 
  StudentRole, 
  CreateStudentInput 
} from '@/utils/studentAuth';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new student account (Allowed for any ranked member: Leader, Finance, Admin, SuperAdmin).
 */
export async function createStudentAction(input: CreateStudentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole === 'Student') {
    return {
      success: false,
      error: 'คุณไม่มีสิทธิ์ในการเพิ่มนักเรียน (ต้องเป็นผู้มียศ เช่น Leader, Finance, Admin, SuperAdmin)',
    };
  }

  const result = await createStudentAccount(input, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  revalidatePath('/funds');
  revalidatePath('/kanban');
  revalidatePath('/', 'layout');
  return result;
}

/**
 * Deletes a student account (SuperAdmin ONLY).
 */
export async function deleteStudentAction(studentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole !== 'SuperAdmin') {
    return {
      success: false,
      error: 'เฉพาะ SuperAdmin (โคตรพ่อโคตรแม่ผู้ดูแลระบบ) เท่านั้นที่สามารถลบนักเรียนได้',
    };
  }

  const result = await deleteStudentAccount(studentId, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  revalidatePath('/funds');
  revalidatePath('/kanban');
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Updates a student's basic details (SuperAdmin ONLY).
 */
export async function updateStudentInfoAction(studentId: string, data: Partial<CreateStudentInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole !== 'SuperAdmin') {
    return {
      success: false,
      error: 'เฉพาะ SuperAdmin เท่านั้นที่สามารถแก้ไขข้อมูลนักเรียนได้',
    };
  }

  const result = await updateStudentInfo(studentId, data, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  revalidatePath('/funds');
  revalidatePath('/kanban');
  revalidatePath('/', 'layout');
  return result;
}

/**
 * Updates a student's role.
 */
export async function updateStudentRoleAction(studentId: string, newRole: StudentRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole === 'Student') {
    return {
      success: false,
      error: 'คุณไม่มีสิทธิ์ในการจัดการบทบาทนักเรียน (ต้องเป็นผู้มียศเท่านั้น)',
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

/**
 * Resets a student's password to default.
 */
export async function resetStudentPasswordAction(studentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const userRole = (user.user_metadata?.role || 'Student') as StudentRole;
  if (userRole === 'Student') {
    return {
      success: false,
      error: 'คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน (ต้องเป็นผู้มียศเท่านั้น)',
    };
  }

  const result = await resetStudentPassword(studentId, userRole);
  if (!result.success) {
    return result;
  }

  revalidatePath('/settings/roles');
  return { success: true };
}

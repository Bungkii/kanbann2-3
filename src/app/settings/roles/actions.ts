'use server';

import { createClient } from '@supabase/supabase-js';

// We must use the service role key to fetch from auth.users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAllUsersWithRoles() {
  // Fetch auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return { error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ (ต้องเช็คว่าใส่ Service Role Key ถูกไหม)' };
  }

  // Fetch roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return { error: 'ไม่สามารถดึงข้อมูล Roles ได้' };
  }

  // Merge
  const usersWithRoles = users.map(u => {
    const roleRecord = roles?.find(r => r.user_id === u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      role: roleRecord?.role || 'user' // Default to user if not found
    };
  });

  return { users: usersWithRoles };
}

export async function updateUserRole(userId: string, newRole: string) {
  // First, verify the caller is admin
  // Since this is a server action, we can use the regular client to check current user
  const { createClient: createServerClient } = await import('@/utils/supabase/server');
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    return { error: 'กรุณาล็อกอิน' };
  }

  const { data: currentUserRole } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (currentUserRole?.role !== 'admin') {
    return { error: 'คุณไม่มีสิทธิ์เป็น Admin ในการแก้ไข Roles' };
  }

  // Caller is admin, now proceed to update using service role
  // We use upsert so if they don't have a record yet, it creates one
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: newRole });

  if (error) {
    console.error('Error updating role:', error);
    return { error: 'เกิดข้อผิดพลาดในการอัปเดต Role' };
  }

  return { success: true };
}

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getSafeStudentAccounts, StudentRole } from '@/utils/studentAuth';
import PageTransition from '@/components/PageTransition';
import RolesClient from './RolesClient';

export const revalidate = 0;

export default async function StudentRolesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const currentUserRole = (user.user_metadata?.role || 'Student') as StudentRole;

  // Allow all ranked users (Leader, Finance, Admin, SuperAdmin) - except Student
  if (currentUserRole === 'Student') {
    redirect('/settings');
  }

  const accounts = await getSafeStudentAccounts();

  return (
    <PageTransition className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <RolesClient initialAccounts={accounts} currentUserRole={currentUserRole} />
    </PageTransition>
  );
}

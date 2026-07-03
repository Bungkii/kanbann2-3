import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import SystemSettingsForm from './SystemSettingsForm';
import { getSystemSettings } from './actions';

export const revalidate = 0;

export default async function SystemSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify admin role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || roleData.role !== 'admin') {
    redirect('/');
  }

  const settings = await getSystemSettings();

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl relative">
        <Link 
          href="/settings"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
        >
          <ArrowLeft size={24} />
        </Link>
        
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="bg-rose-100 text-rose-600 p-3 rounded-full">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ระบบทั่วไป</h1>
              <p className="text-sm text-slate-500">ตั้งค่าการเปิด-ปิดระบบต่างๆ</p>
            </div>
          </div>

          <SystemSettingsForm initialSettings={settings} />
        </div>
      </div>
    </main>
  );
}

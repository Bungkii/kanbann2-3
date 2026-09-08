import { createClient } from '@/utils/supabase/server';
import KanbanBoard from '@/components/KanbanBoard';
import StudentNavbar from '@/components/StudentNavbar';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from('homework_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  if (error) {
    console.error('Error fetching tasks:', error);
  }

  const { data: statusSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'primja_status')
    .single();

  const isOffline = statusSetting?.value === 'offline';

  if (isOffline) {
    const { data: timeSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'primja_offline_until')
      .single();
      
    let offlineMsg = 'พริมจ๋ากำลังปรับปรุงระบบอยู่จ้า 🛠️';
    if (timeSetting?.value) {
      const untilDate = new Date(timeSetting.value);
      offlineMsg = `คาดว่าจะกลับมาใช้งานได้เวลา: ${untilDate.toLocaleString('th-TH')}`;
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white rounded-3xl p-10 max-w-md shadow-sm border border-slate-200">
          <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">ปรับปรุงระบบอยู่จ้า 🛠️</h2>
          <p className="text-slate-500 mb-6">{offlineMsg}</p>
          <Link href="/" className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-6 py-2.5 rounded-full transition-colors inline-block">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased relative">
      {/* Subtle Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-purple-500/4 rounded-full blur-3xl" />
      </div>

      {/* Floating Pill Header Navigation */}
      <StudentNavbar isAuthenticated={isAuthenticated} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-12">
        <PageTransition className="flex-1 w-full">
          <KanbanBoard initialTasks={tasks || []} isAuthenticated={isAuthenticated} />
        </PageTransition>
      </main>
    </div>
  );
}

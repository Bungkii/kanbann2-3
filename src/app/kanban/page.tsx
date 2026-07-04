import { createClient } from '@/utils/supabase/server';
import KanbanBoard from '@/components/KanbanBoard';
import LineBroadcastButtons from '@/components/LineBroadcastButtons';
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <div>
              <span className="text-slate-800">ทับสามไม่ทำงาน</span>
              <span className="text-red-500"> by ชามนพิ</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          </h1>
        </div>
        {isAuthenticated && <LineBroadcastButtons />}
      </header>

      <PageTransition className="flex-1 p-8 overflow-x-auto">
        <KanbanBoard initialTasks={tasks || []} isAuthenticated={isAuthenticated} />
      </PageTransition>
    </div>
  );
}

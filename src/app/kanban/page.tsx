import { createClient } from '@/utils/supabase/server';
import KanbanBoard from '@/components/KanbanBoard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from('homework_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-slate-800">พริม</span>
            <span className="text-red-500">ทวงยิก ม.2/3 🚨</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-x-auto">
        <KanbanBoard initialTasks={tasks || []} />
      </main>
    </div>
  );
}

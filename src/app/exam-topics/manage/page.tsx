import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { getExamTopics } from '../actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ManageClient from './ManageClient';

export const revalidate = 0;

export default async function ManageExamTopicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const examTopics = await getExamTopics();

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/exam-topics"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            กลับหน้าเนื้อหาออกสอบ
          </Link>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">จัดการเนื้อหาสอบ</h1>
        </div>

        <ManageClient initialTopics={examTopics} />
      </div>
    </main>
  );
}

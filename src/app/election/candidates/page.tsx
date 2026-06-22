import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CandidateForm from './CandidateForm';
import CandidateList from './CandidateList';

export const revalidate = 0;

export default async function CandidatesAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching candidates:', error);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl relative">
        <Link 
          href="/election/edit"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="กลับ"
        >
          <ArrowLeft size={24} />
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">จัดการรายชื่อผู้สมัคร</h1>
          <CandidateForm />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">รายชื่อผู้สมัครปัจจุบัน</h2>
          <CandidateList candidates={candidates || []} />
        </div>
      </div>
    </main>
  );
}

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import DeleteVoteButton from './DeleteVoteButton';

export const revalidate = 0;

export default async function EditElectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: votes, error } = await supabase
    .from('leader_votes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching votes:', error);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl relative">
        <Link 
          href="/"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="กลับหน้าแรก"
        >
          <ArrowLeft size={24} />
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b pb-4 gap-4">
            <h1 className="text-3xl font-bold text-slate-800">ระบบจัดการผลโหวตหัวหน้าห้อง</h1>
            <Link
              href="/election/candidates"
              className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
            >
              จัดการรายชื่อผู้สมัคร
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-4 rounded-tl-xl font-medium">LINE User ID</th>
                  <th className="p-4 font-medium">โหวตให้</th>
                  <th className="p-4 font-medium">เวลาโหวต</th>
                  <th className="p-4 rounded-tr-xl font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!votes || votes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูลการโหวต</td>
                  </tr>
                ) : (
                  votes.map((vote) => (
                    <tr key={vote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600 font-mono truncate max-w-[150px]">{vote.user_id}</td>
                      <td className="p-4 font-semibold text-slate-800">{vote.voted_for}</td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(vote.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-4 text-right">
                        <DeleteVoteButton voteId={vote.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

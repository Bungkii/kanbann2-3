import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import CleaningForm from './CleaningForm';

export const revalidate = 0;

export default async function CleaningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: schedule, error } = await supabase
    .from('cleaning_schedule')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching cleaning schedule:', error);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl relative">
        <Link 
          href="/settings"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="กลับ"
        >
          <ArrowLeft size={24} />
        </Link>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-4">
              <Trash2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ตารางเวรทำความสะอาด</h1>
            <p className="text-slate-500">
              กำหนดเวรทำความสะอาดสำหรับวันจันทร์ - ศุกร์
            </p>
          </div>

          {schedule && schedule.length > 0 ? (
            <CleaningForm initialData={schedule} />
          ) : (
            <div className="text-center text-slate-500 py-8">ไม่มีข้อมูลในระบบ (กรุณารัน SQL Migration ก่อน)</div>
          )}
        </div>
      </div>
    </main>
  );
}

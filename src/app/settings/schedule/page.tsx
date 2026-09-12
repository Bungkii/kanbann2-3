import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import ScheduleForm from './ScheduleForm';
import { DEFAULT_CLASS_SCHEDULE, ScheduleRow } from '@/utils/defaultSchedule';

export const revalidate = 0;

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: schedule, error } = await supabase
    .from('class_schedule')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('period', { ascending: true });

  if (error) {
    console.error('Error fetching class schedule:', error);
  }

  // Combine default schedule with database schedule so table is never blank
  const scheduleMap = new Map<string, ScheduleRow>();

  DEFAULT_CLASS_SCHEDULE.forEach(item => {
    scheduleMap.set(`${item.day_of_week}-${item.period}`, {
      day_of_week: item.day_of_week,
      period: item.period,
      subject: item.subject,
      teacher: item.teacher,
    });
  });

  if (schedule && schedule.length > 0) {
    schedule.forEach((item: any) => {
      scheduleMap.set(`${item.day_of_week}-${item.period}`, {
        day_of_week: item.day_of_week,
        period: item.period,
        subject: item.subject || '',
        teacher: item.teacher || null,
      });
    });
  }

  const finalSchedule = Array.from(scheduleMap.values()).sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.period - b.period;
  });

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
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4">
              <Calendar size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ตารางสอน (ม.2/3)</h1>
            <p className="text-slate-500">
              จัดการวิชาและครูผู้สอนในแต่ละคาบ (1-8) ซิงค์กับระบบพริมจ๋าและ LINE Bot
            </p>
          </div>

          <ScheduleForm initialData={finalSchedule} isDbEmpty={!schedule || schedule.length === 0} />
        </div>
      </div>
    </main>
  );
}

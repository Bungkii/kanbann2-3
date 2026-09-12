import { createClient } from '@/utils/supabase/server';
import ScheduleViewer from './ScheduleViewer';
import { Metadata } from 'next';
import { DEFAULT_CLASS_SCHEDULE, ScheduleRow } from '@/utils/defaultSchedule';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'ตารางสอนของห้อง 3 (ม.2/3)',
  description: 'ตารางสอนและตารางเรียนประจำสัปดาห์ ม.2/3 พร้อมแสดงคาบเรียนปัจจุบันและซิงค์ข้อมูลเรียลไทม์',
};

export default async function SchedulePage() {
  let schedule: ScheduleRow[] = [];
  let isLoggedIn = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;

    const { data, error } = await supabase
      .from('class_schedule')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('period', { ascending: true });

    if (error) {
      console.error('Error fetching class schedule:', error);
    }

    const scheduleMap = new Map<string, ScheduleRow>();
    DEFAULT_CLASS_SCHEDULE.forEach(item => {
      scheduleMap.set(`${item.day_of_week}-${item.period}`, {
        day_of_week: item.day_of_week,
        period: item.period,
        subject: item.subject,
        teacher: item.teacher,
      });
    });

    if (data && data.length > 0) {
      data.forEach((item: any) => {
        scheduleMap.set(`${item.day_of_week}-${item.period}`, {
          id: item.id,
          day_of_week: item.day_of_week,
          period: item.period,
          subject: item.subject || '',
          teacher: item.teacher || null,
        });
      });
    }

    schedule = Array.from(scheduleMap.values()).sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.period - b.period;
    });
  } catch (err) {
    console.error('Error in SchedulePage server component:', err);
    schedule = DEFAULT_CLASS_SCHEDULE;
  }

  return <ScheduleViewer initialSchedule={schedule} isLoggedIn={isLoggedIn} />;
}

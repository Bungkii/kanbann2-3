import { createClient } from '@/utils/supabase/server';
import ScheduleViewer, { ScheduleRow } from './ScheduleViewer';
import { Metadata } from 'next';

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
    } else if (data) {
      schedule = data;
    }
  } catch (err) {
    console.error('Error in SchedulePage server component:', err);
  }

  return <ScheduleViewer initialSchedule={schedule} isLoggedIn={isLoggedIn} />;
}

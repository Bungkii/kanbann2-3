import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const defaultSchedule = [
      { day_of_week: 1, uniform_name: 'ชุดนักเรียน', theme_color: '#FFD700' },
      { day_of_week: 2, uniform_name: 'ชุดนักเรียน', theme_color: '#FF69B4' },
      { day_of_week: 3, uniform_name: 'ชุดพละและเสื้อช้อป', theme_color: '#32CD32' },
      { day_of_week: 4, uniform_name: 'ชุดนักเรียน', theme_color: '#FFA500' },
      { day_of_week: 5, uniform_name: 'ชุดนักเรียน', theme_color: '#00BFFF' }
    ];

    let successCount = 0;

    // Reset each day back to default
    for (const schedule of defaultSchedule) {
      const { error } = await supabase
        .from('uniform_schedule')
        .update({
          uniform_name: schedule.uniform_name,
          theme_color: schedule.theme_color,
          updated_at: new Date().toISOString()
        })
        .eq('day_of_week', schedule.day_of_week);
        
      if (!error) successCount++;
    }

    return NextResponse.json({ success: true, message: `Reset ${successCount} uniform schedules to defaults` });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

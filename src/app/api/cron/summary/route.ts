import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createTodayAddedFlexMessage, Task } from '@/utils/line/flex';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is missing' }, { status: 500 });
    }

    // Fetch all tasks sorted by due date
    const { data: tasks, error } = await supabase
      .from('homework_tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const flexMessage = createTodayAddedFlexMessage(tasks as Task[]);

    // Send Broadcast to LINE
    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        messages: [flexMessage],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API Error:', errorText);
      return NextResponse.json({ error: 'Failed to send LINE message', details: errorText }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Summary broadcast sent', tasksCount: tasks.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

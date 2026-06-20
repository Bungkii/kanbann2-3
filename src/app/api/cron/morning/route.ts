import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMorningFlexMessage, Task } from '@/utils/line/flex';

export async function GET(request: Request) {
  // Optional: Add basic security header check (like a cron secret)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is missing' }, { status: 500 });
    }

    // Fetch tasks due today (or overdue)
    // To keep it simple, we fetch all tasks not 'done' and filter those due today/before today.
    // However, status is tracked on client side. So we just fetch all tasks.
    const { data: tasks, error } = await supabase
      .from('homework_tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Filter tasks due today or earlier
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueTodayOrOverdue = (tasks as Task[]).filter(task => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() <= today.getTime();
    });

    const flexMessage = createMorningFlexMessage(dueTodayOrOverdue);

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

    return NextResponse.json({ success: true, message: 'Morning broadcast sent', tasksCount: dueTodayOrOverdue.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

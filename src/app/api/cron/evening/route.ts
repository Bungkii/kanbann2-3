import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
import { createEveningFlexMessage, Task } from '@/utils/line/flex';

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

    // Fetch all tasks for evening summary
    const { data: tasks, error } = await supabase
      .from('homework_tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const flexMessage = createEveningFlexMessage(tasks as Task[]);

    const groupId = process.env.LINE_GROUP_ID;
    const apiUrl = groupId 
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';
      
    const bodyPayload = groupId
      ? { to: groupId, messages: [flexMessage] }
      : { messages: [flexMessage] };

    // Send to LINE
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API Error:', errorText);
      return NextResponse.json({ error: 'Failed to send LINE message', details: errorText }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Evening broadcast sent', tasksCount: tasks.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

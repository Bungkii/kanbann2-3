import { NextResponse } from 'next/server';
import { createMenuFlexMessage, createMorningFlexMessage, createEveningFlexMessage, Task } from '@/utils/line/flex';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!lineToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is missing');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const events = body.events;
    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ message: 'No events' }, { status: 200 });
    }

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        
        // ถ้าพิมพ์คำว่า "พริมจ๋า ดูไอดี"
        if (text === 'พริมจ๋า ดูไอดี') {
          const groupId = event.source.groupId || event.source.roomId;
          const replyText = groupId ? `Group ID ของกลุ่มนี้คือ:\n${groupId}` : 'ไม่ได้อยู่ในกลุ่มจ้า (นี่คือแชทส่วนตัว)';
          
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${lineToken}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: replyText }],
            }),
          });
          continue;
        }

        // ถ้าพิมพ์คำว่า "คำสั่งเพิ่มเติม"
        if (text === 'คำสั่งเพิ่มเติม') {
          const replyText = `🤖 คู่มือการใช้งานของชามนพิ 🤖\nสามารถพิมพ์คำสั่งเหล่านี้ในแชทได้เลยคราบ!\n\n🔹 พริมจ๋า - เรียกเมนูหลัก\n🔹 พริมจ๋า งานวันนี้ - ดูงานที่ต้องส่งวันนี้\n🔹 พริมจ๋า งานค้าง - ดูงานที่เลยกำหนดแล้ว\n🔹 พริมจ๋า ดูไอดี - ดูไอดีกลุ่มสำหรับแอดมิน\n\n💡 หากต้องการเพิ่มงาน กดปุ่มจากเมนูหลักได้เลยจ้า`;
          
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${lineToken}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: replyText }],
            }),
          });
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า งานวันนี้" หรือ "พริมจ๋า งานค้าง"
        if (text === 'พริมจ๋า งานวันนี้' || text === 'พริมจ๋า งานค้าง') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: tasks, error } = await supabase
            .from('homework_tasks')
            .select('*')
            .order('due_date', { ascending: true });

          if (error) {
            console.error('Error fetching tasks:', error);
            continue;
          }

          let flexMessage;
          if (text === 'พริมจ๋า งานวันนี้') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueTodayOrOverdue = (tasks as Task[]).filter(task => {
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === today.getTime();
            });
            flexMessage = createMorningFlexMessage(dueTodayOrOverdue);
          } else {
            flexMessage = createEveningFlexMessage(tasks as Task[]);
          }

          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${lineToken}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [flexMessage],
            }),
          });
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า"
        if (text === 'พริมจ๋า') {
          const flexMessage = createMenuFlexMessage();

          // ส่งข้อความกลับด้วย LINE Reply API
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${lineToken}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [flexMessage],
            }),
          });
          continue;
        }
      }
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

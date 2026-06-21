import { NextResponse } from 'next/server';
import { createMenuFlexMessage, createMorningFlexMessage, createEveningFlexMessage, createVoteLeaderFlexMessage, Task } from '@/utils/line/flex';
import { createClient } from '@supabase/supabase-js';

// GET handler สำหรับ LINE Webhook verification
export async function GET() {
  return NextResponse.json({ message: 'Webhook is active' }, { status: 200 });
}

// Helper function สำหรับ reply ข้อความกลับ LINE พร้อม error handling
async function replyToLine(replyToken: string, messages: any[], lineToken: string) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LINE Reply API Error:', response.status, errorText);
  }

  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook received:', JSON.stringify(body).substring(0, 500));

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!lineToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is missing');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const events = body.events;
    if (!events || !Array.isArray(events)) {
      console.log('No events in webhook body');
      return NextResponse.json({ message: 'No events' }, { status: 200 });
    }

    console.log(`Processing ${events.length} event(s)`);

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim().replace(/^["']|["']$/g, '');
        console.log(`Received text message: "${text}"`);
        
        // ถ้าพิมพ์คำว่า "พริมจ๋า ดูไอดี"
        if (text === 'พริมจ๋า ดูไอดี') {
          const groupId = event.source.groupId || event.source.roomId;
          const replyText = groupId ? `Group ID ของกลุ่มนี้คือ:\n${groupId}` : 'ไม่ได้อยู่ในกลุ่มจ้า (นี่คือแชทส่วนตัว)';
          
          await replyToLine(event.replyToken, [{ type: 'text', text: replyText }], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "คำสั่งเพิ่มเติม"
        if (text === 'คำสั่งเพิ่มเติม') {
          const replyText = `คู่มือการใช้งานของชามนพิ\nสามารถพิมพ์คำสั่งเหล่านี้ในแชทได้เลยคราบ\n🔹 "พริมจ๋า" - เรียกเมนูหลัก\n🔹 "พริมจ๋า งานวันนี้" - ดูงานที่ต้องส่งวันนี้\n🔹 "พริมจ๋า งานค้าง" - ดูงานที่เลยกำหนดแล้ว\n🔹 "พริมจ๋า เปลี่ยนหัวหน้า" - เปิดโหวตเปลี่ยนหัวหน้า\n🔹 "พริมจ๋า สรุปโหวตหัวหน้า" - ดูสรุปคะแนนโหวต\n🔹 "พริมจ๋า ดูไอดี" - ดูไอดีกลุ่ม`;
          
          await replyToLine(event.replyToken, [{ type: 'text', text: replyText }], lineToken);
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
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน กรุณาลองใหม่ภายหลังจ้า 😢' }], lineToken);
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

          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า เปลี่ยนหัวหน้า"
        if (text === 'พริมจ๋า เปลี่ยนหัวหน้า') {
          const flexMessage = createVoteLeaderFlexMessage();
          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ถ้าพิมพ์โหวตหัวหน้า
        if (text.startsWith('โหวตหัวหน้า:')) {
          const votedFor = text.replace('โหวตหัวหน้า:', '').trim();
          const userId = event.source.userId;
          
          if (!userId) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ไม่สามารถบันทึกโหวตได้ กรุณาแอดบอทเป็นเพื่อนก่อนโหวตนะจ้ะ 😢' }], lineToken);
            continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { error } = await supabase
            .from('leader_votes')
            .upsert({ user_id: userId, voted_for: votedFor }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error saving vote:', error);
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการบันทึกโหวต กรุณาลองใหม่ 😢' }], lineToken);
          } else {
            await replyToLine(event.replyToken, [{ type: 'text', text: `บันทึกโหวตให้ ${votedFor} เรียบร้อยแล้วจ้า 🎉` }], lineToken);
          }
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า สรุปโหวตหัวหน้า"
        if (text === 'พริมจ๋า สรุปโหวตหัวหน้า') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: votes, error } = await supabase
            .from('leader_votes')
            .select('voted_for');

          if (error) {
            console.error('Error fetching votes:', error);
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการดึงข้อมูลโหวต 😢' }], lineToken);
            continue;
          }

          if (!votes || votes.length === 0) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีคนโหวตเลยจ้า 🥺' }], lineToken);
            continue;
          }

          const voteCounts = votes.reduce((acc: any, vote) => {
            acc[vote.voted_for] = (acc[vote.voted_for] || 0) + 1;
            return acc;
          }, {});

          const sortedVotes = Object.entries(voteCounts).sort((a: any, b: any) => b[1] - a[1]);
          let summaryText = '📊 สรุปผลโหวตหัวหน้า\n\n';
          sortedVotes.forEach(([name, count]) => {
            summaryText += `- ${name}: ${count} โหวต\n`;
          });
          summaryText += `\nรวมทั้งหมด ${votes.length} โหวต`;

          await replyToLine(event.replyToken, [{ type: 'text', text: summaryText }], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า" (ต้องอยู่หลัง sub-commands ที่ขึ้นต้นด้วย "พริมจ๋า" เพราะ exact match)
        if (text === 'พริมจ๋า') {
          const flexMessage = createMenuFlexMessage();
          await replyToLine(event.replyToken, [flexMessage], lineToken);
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

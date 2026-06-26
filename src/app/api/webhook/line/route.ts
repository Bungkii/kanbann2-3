import { NextResponse } from 'next/server';
import { createMenuFlexMessage, createMorningFlexMessage, createEveningFlexMessage, createVoteLeaderFlexMessage, createTodayAddedFlexMessage, Task } from '@/utils/line/flex';
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
        
        // ถ้าพิมพ์คำว่า "พริมจ๋า ดูไอดี" หรือ "พริมจ๋าดูไอดี"
        if (text === 'พริมจ๋า ดูไอดี' || text === 'พริมจ๋าดูไอดี') {
          const groupId = event.source.groupId || event.source.roomId;
          const replyText = groupId ? `Group ID ของกลุ่มนี้คือ:\n${groupId}` : 'ไม่ได้อยู่ในกลุ่มจ้า (นี่คือแชทส่วนตัว)';
          
          await replyToLine(event.replyToken, [{ type: 'text', text: replyText }], lineToken);
          continue;
        }

        // New funny commands
        if (text === 'พลอยจี') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'อุ๊วะฮะฮ่า เจี๊ยกๆ อุกๆ กรู๊ววว! 🐒' }], lineToken);
          continue;
        }
        if (text === 'อัยย์แจ๋') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'ระนาดเอก: เป็นเครื่องดนตรีประเภทตี ทำหน้าที่เป็นผู้นำวง มีเสียงสดใสและกังวาน 🎶' }], lineToken);
          continue;
        }
        if (text === 'ยูกิจือ') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'Skibidi Toilet คือสงครามระหว่างโถส้วมมีหัวคนร้องเพลง Skibidi Bop Bop Yes Yes กับกองทัพตากล้อง (Cameraman) ส่วน Italian Brainrot คือมุกตลกปั่นๆ สไตล์อิตาลี 🚽🎥' }], lineToken);
          continue;
        }
        if (text === 'ออสตินจีจ้าบูกิ๊ก') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'ไม่เป็นไรนะ เรื่องแค่นี้เอง เราให้อภัยเสมอ ปล่อยวางเถอะ 🤍' }], lineToken);
          continue;
        }
        if (text === 'ดินปืนปู๊ดแป่ว') {
          const today = new Date();
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' };
          const thDateString = today.toLocaleDateString('th-TH', options);
          await replyToLine(event.replyToken, [{ type: 'text', text: `อรุณสวัสดิ์จ้า! วันนี้คือ ${thDateString} ขอให้เป็นวันที่ดีนะ ☀️` }], lineToken);
          continue;
        }
        if (text === 'ฟอสเฟี้ยวฟ้าว') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'เมนูวันนี้น่ารักสุดๆ: นมสดสตรอว์เบอร์รีปั่นหวานน้อย ท็อปด้วยไอศกรีมวานิลลาและวิปครีมเรนโบว์ 🍓🍦✨' }], lineToken);
          continue;
        }
        if (text === 'แสตมป์') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'กำลังค้นหาพิกัดห้องน้ำทั่วโลก... 🌍 🚽 พบห้องน้ำที่ใกล้ที่สุด: อยู่ในใจเธอ (หยอกๆ ไปเข้าห้องน้ำโรงเรียนเถอะ)' }], lineToken);
          continue;
        }
        if (text === 'ซิน') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'ว่างเปล่า...' }], lineToken);
          continue;
        }
        if (text.includes('ฉงฉึกฉัก') || text === 'ฉง') {
          await replyToLine(event.replyToken, [{ type: 'text', text: 'ฮอร์โมนเพศชาย (Testosterone) ทำให้เสียงแตกหน่อและมีกล้ามเนื้อ ส่วนฮอร์โมนเพศหญิง (Estrogen) ควบคุมรอบเดือนและการเปลี่ยนแปลงของร่างกาย 🧬' }], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "คำสั่งเพิ่มเติม"
        if (text === 'คำสั่งเพิ่มเติม') {
          const replyText = `คู่มือการใช้งานของชามนพิ\nสามารถพิมพ์คำสั่งเหล่านี้ในแชทได้เลยคราบ\n🔹 "พริมจ๋า" - เรียกเมนูหลัก\n🔹 "พริมจ๋า งานวันนี้" - ดูงานที่ต้องส่งวันนี้\n🔹 "พริมจ๋า งานค้าง" - ดูงานที่เลยกำหนดแล้ว\n🔹 "พริมจ๋า สรุปงาน" - ดูงานทั้งหมดในระบบ\n🔹 "พริมจ๋าวันนี้ใส่ชุดไร" - ดูชุดนักเรียนที่ต้องใส่\n🔹 "พริมจ๋า วันนี้ใครเวร" - ดูเวรทำความสะอาด\n🔹 "พริมจ๋า ต่อไปคาบไร" - ดูวิชาเรียนคาบต่อไป\n🔹 "พริมจ๋า พรุ่งนี้เรียนไร" - ดูตารางเรียนพรุ่งนี้\n🔹 "พริมจ๋า เปลี่ยนหัวหน้า" - เปิดโหวตเปลี่ยนหัวหน้า\n🔹 "พริมจ๋า สรุปโหวตหัวหน้า" - ดูสรุปคะแนนโหวต\n🔹 "พริมจ๋า ดูไอดี" - ดูไอดีกลุ่ม`;
          
          await replyToLine(event.replyToken, [{ type: 'text', text: replyText }], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า งานวันนี้", "พริมจ๋า งานค้าง" หรือ "พริมจ๋า สรุปงาน"
        if (['พริมจ๋า งานวันนี้', 'พริมจ๋างานวันนี้', 'พริมจ๋า งานค้าง', 'พริมจ๋างานค้าง', 'พริมจ๋า สรุปงาน', 'พริมจ๋าสรุปงาน'].includes(text)) {
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
          if (text === 'พริมจ๋า สรุปงาน' || text === 'พริมจ๋าสรุปงาน') {
            flexMessage = createTodayAddedFlexMessage(tasks as Task[]);
          } else if (text === 'พริมจ๋า งานวันนี้' || text === 'พริมจ๋างานวันนี้') {
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

        // ถ้าถามเรื่องชุด เช่น พริมจ๋าวันนี้ใส่ชุดไร, พรุ่งนี้ใส่ชุดอะไร, วันจันทร์ใส่ชุดอะไร
        if (text.includes('พริม') && (text.includes('ใส่ชุด') || text.includes('ชุดอะไร') || text.includes('ชุดไร') || text.includes('ชุดไหน'))) {
          let targetDayOfWeek = -1;
          let isFuture = false;
          let isSpecificDay = false;
          
          const today = new Date();
          const options = { timeZone: 'Asia/Bangkok' };
          const thDate = new Date(today.toLocaleString('en-US', options));
          const currentDayOfWeek = thDate.getDay();

          if (text.includes('พรุ่งนี้')) {
            targetDayOfWeek = (currentDayOfWeek + 1) % 7;
            isFuture = true;
          } else if (text.includes('วันจันทร์')) { targetDayOfWeek = 1; isSpecificDay = true; }
          else if (text.includes('วันอังคาร')) { targetDayOfWeek = 2; isSpecificDay = true; }
          else if (text.includes('วันพุธ')) { targetDayOfWeek = 3; isSpecificDay = true; }
          else if (text.includes('วันพฤหัส')) { targetDayOfWeek = 4; isSpecificDay = true; }
          else if (text.includes('วันศุกร์')) { targetDayOfWeek = 5; isSpecificDay = true; }
          else if (text.includes('วันเสาร์')) { targetDayOfWeek = 6; isSpecificDay = true; }
          else if (text.includes('วันอาทิตย์')) { targetDayOfWeek = 0; isSpecificDay = true; }
          else {
            // Default to today
            targetDayOfWeek = currentDayOfWeek;
          }

          isFuture = isFuture || isSpecificDay;

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          if (targetDayOfWeek === 0 || targetDayOfWeek === 6) {
             const dayStr = text.includes('พรุ่งนี้') ? 'พรุ่งนี้' : (isSpecificDay ? 'วันหยุด' : 'วันนี้');
             await replyToLine(event.replyToken, [{ type: 'text', text: `${dayStr}เป็นวันหยุด พักผ่อนได้เลยจ้าไม่ต้องใส่ชุดไปเรียน! 🎉` }], lineToken);
             continue;
          }

          const { data: schedule, error: scheduleError } = await supabase
            .from('uniform_schedule')
            .select('*')
            .eq('day_of_week', targetDayOfWeek)
            .single();

          if (scheduleError || !schedule) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีข้อมูลชุดของวันนั้นจ้า (แอดมินลืมเพิ่มข้อมูล)' }], lineToken);
            continue;
          }

          const { createUniformFlexMessage } = await import('@/utils/line/flex');
          const displayDayName = text.includes('พรุ่งนี้') ? `พรุ่งนี้ (${schedule.day_name})` : schedule.day_name;
          
          const flexMessage = createUniformFlexMessage(displayDayName, schedule.uniform_name, schedule.theme_color, isFuture);

          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ตารางเวร: พริมจ๋าใครเวร, วันนี้ใครเวร
        if (text.includes('พริม') && text.includes('ใครเวร')) {
          let targetDayOfWeek = -1;
          const today = new Date();
          const thDate = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
          const currentDayOfWeek = thDate.getDay();

          if (text.includes('พรุ่งนี้')) targetDayOfWeek = (currentDayOfWeek + 1) % 7;
          else if (text.includes('วันจันทร์')) targetDayOfWeek = 1;
          else if (text.includes('วันอังคาร')) targetDayOfWeek = 2;
          else if (text.includes('วันพุธ')) targetDayOfWeek = 3;
          else if (text.includes('วันพฤหัส')) targetDayOfWeek = 4;
          else if (text.includes('วันศุกร์')) targetDayOfWeek = 5;
          else if (text.includes('วันเสาร์')) targetDayOfWeek = 6;
          else if (text.includes('วันอาทิตย์')) targetDayOfWeek = 0;
          else targetDayOfWeek = currentDayOfWeek;

          if (targetDayOfWeek === 0 || targetDayOfWeek === 6) {
             const dayStr = text.includes('พรุ่งนี้') ? 'พรุ่งนี้' : 'วันนี้';
             await replyToLine(event.replyToken, [{ type: 'text', text: `${dayStr}เป็นวันหยุด ไม่มีเวรจ้า! 🎉` }], lineToken);
             continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: schedule } = await supabase.from('cleaning_schedule').select('*').eq('day_of_week', targetDayOfWeek).single();

          if (!schedule) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีข้อมูลเวรของวันนั้นจ้า' }], lineToken);
            continue;
          }

          const { createCleaningFlexMessage } = await import('@/utils/line/flex');
          const flexMessage = createCleaningFlexMessage(schedule.day_name, schedule.cleaners);
          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // คาบต่อไป: พริมจ๋าต่อไปคาบไร
        if (text.includes('พริม') && (text.includes('ต่อไป') || text.includes('คาบไหน')) && (text.includes('เรียน') || text.includes('คาบ'))) {
          const { getCurrentOrNextPeriod } = await import('@/utils/schedule');
          const periodInfo = getCurrentOrNextPeriod();
          
          if (!periodInfo) {
             await replyToLine(event.replyToken, [{ type: 'text', text: 'หมดคาบเรียนของวันนี้แล้วจ้า พักผ่อนได้เลย! 🎉' }], lineToken);
             continue;
          }

          const today = new Date();
          const thDate = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
          const currentDayOfWeek = thDate.getDay();

          if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
             await replyToLine(event.replyToken, [{ type: 'text', text: 'วันนี้วันหยุดนะ ไม่มีเรียนจ้า! 🎉' }], lineToken);
             continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: classData } = await supabase
            .from('class_schedule')
            .select('*')
            .eq('day_of_week', currentDayOfWeek)
            .eq('period', periodInfo.period)
            .single();

          if (!classData) {
            await replyToLine(event.replyToken, [{ type: 'text', text: `คาบ ${periodInfo.period} ยังไม่มีข้อมูลวิชาจ้า` }], lineToken);
            continue;
          }

          const { createNextPeriodFlexMessage } = await import('@/utils/line/flex');
          const flexMessage = createNextPeriodFlexMessage(periodInfo.period, classData.subject, classData.teacher, periodInfo.timeStr, periodInfo.isNext);
          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ตารางเรียน: พริมจ๋าพรุ่งนี้เรียนไร / วันนี้เรียนไร
        if (text.includes('พริม') && text.includes('เรียนไร')) {
          let targetDayOfWeek = -1;
          const today = new Date();
          const thDate = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
          const currentDayOfWeek = thDate.getDay();

          if (text.includes('พรุ่งนี้')) targetDayOfWeek = (currentDayOfWeek + 1) % 7;
          else if (text.includes('วันจันทร์')) targetDayOfWeek = 1;
          else if (text.includes('วันอังคาร')) targetDayOfWeek = 2;
          else if (text.includes('วันพุธ')) targetDayOfWeek = 3;
          else if (text.includes('วันพฤหัส')) targetDayOfWeek = 4;
          else if (text.includes('วันศุกร์')) targetDayOfWeek = 5;
          else targetDayOfWeek = currentDayOfWeek;

          if (targetDayOfWeek === 0 || targetDayOfWeek === 6) {
             const dayStr = text.includes('พรุ่งนี้') ? 'พรุ่งนี้' : 'วันนี้';
             await replyToLine(event.replyToken, [{ type: 'text', text: `${dayStr}เป็นวันหยุด พักผ่อนได้เลยจ้าไม่ต้องเรียน! 🎉` }], lineToken);
             continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: classes } = await supabase
            .from('class_schedule')
            .select('*')
            .eq('day_of_week', targetDayOfWeek)
            .order('period', { ascending: true });

          if (!classes || classes.length === 0) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีข้อมูลตารางเรียนของวันนั้นจ้า' }], lineToken);
            continue;
          }

          const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
          const dayName = text.includes('พรุ่งนี้') ? `พรุ่งนี้ (${dayNames[targetDayOfWeek]})` : dayNames[targetDayOfWeek];

          const { createDailyScheduleFlexMessage } = await import('@/utils/line/flex');
          const flexMessage = createDailyScheduleFlexMessage(dayName, classes);
          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ถ้าพิมพ์ "พริมจ๋า ส่งโพลล่าสุด" หรือ "พริมจ๋าส่งโพลล่าสุด" (เพื่อประหยัด Push Quota)
        if (text === 'พริมจ๋า ส่งโพลล่าสุด' || text === 'พริมจ๋าส่งโพลล่าสุด') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Get latest poll
          const { data: latestPoll, error: pollError } = await supabase
            .from('custom_polls')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (pollError || !latestPoll) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีโพลในระบบจ้า' }], lineToken);
            continue;
          }

          const { createCustomPollFlexMessage } = await import('@/utils/line/flex');
          const flexMessage = createCustomPollFlexMessage(
            latestPoll.id,
            latestPoll.question,
            latestPoll.options,
            latestPoll.end_time
          );

          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "พริมจ๋า เปลี่ยนหัวหน้า" หรือ "พริมจ๋าเปลี่ยนหัวหน้า"
        if (text === 'พริมจ๋า เปลี่ยนหัวหน้า' || text === 'พริมจ๋าเปลี่ยนหัวหน้า') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: candidates, error } = await supabase
            .from('candidates')
            .select('name')
            .order('created_at', { ascending: true });

          if (error || !candidates || candidates.length === 0) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีรายชื่อผู้สมัครในระบบ กรุณาเพิ่มผู้สมัครผ่านหน้าเว็บก่อนจ้า' }], lineToken);
            continue;
          }

          const { createVoteLeaderFlexMessage } = await import('@/utils/line/flex');
          const flexMessage = createVoteLeaderFlexMessage(candidates);
          await replyToLine(event.replyToken, [flexMessage], lineToken);
          continue;
        }

        // ถ้าพิมพ์โหวตหัวหน้า
        if (text.startsWith('โหวตหัวหน้า:')) {
          const votedForText = text.replace('โหวตหัวหน้า:', '').trim();
          const userId = event.source.userId;
          
          if (!userId) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'กรุณาแอดบอทเป็นเพื่อนก่อนโหวตนะจ้ะ' }], lineToken);
            continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { error: voteError } = await supabase
            .from('leader_votes')
            .upsert({ user_id: userId, voted_for: votedForText }, { onConflict: 'user_id' });

          if (voteError) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการบันทึกโหวต' }], lineToken);
          } else {
            await replyToLine(event.replyToken, [{ type: 'text', text: `บันทึกโหวต "${votedForText}" สำเร็จ!` }], lineToken);
          }
          continue;
        }

        // ถ้าพิมพ์ "พริมจ๋า สรุปโหวตหัวหน้า" หรือ "พริมจ๋าสรุปโหวตหัวหน้า"
        if (text === 'พริมจ๋า สรุปโหวตหัวหน้า' || text === 'พริมจ๋าสรุปโหวตหัวหน้า') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: votes, error: votesError } = await supabase
            .from('leader_votes')
            .select('voted_for');

          if (votesError) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }], lineToken);
            continue;
          }

          if (!votes || votes.length === 0) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ยังไม่มีคนโหวตเลยจ้า' }], lineToken);
            continue;
          }

          const voteCounts = votes.reduce((acc: any, vote) => {
            acc[vote.voted_for] = (acc[vote.voted_for] || 0) + 1;
            return acc;
          }, {});

          const sortedVotes = Object.entries(voteCounts).sort((a: any, b: any) => b[1] - a[1]);
          let summaryText = `📊 สรุปผลโหวตหัวหน้า\n\n`;
          sortedVotes.forEach(([name, count]) => {
            summaryText += `- ${name}: ${count} โหวต\n`;
          });
          summaryText += `\nรวมทั้งหมด ${votes.length} โหวต`;

          await replyToLine(event.replyToken, [{ type: 'text', text: summaryText }], lineToken);
          continue;
        }

        // ถ้าพิมพ์โหวตโพล
        if (text.startsWith('โหวตโพล:')) {
          // Format: โหวตโพล:<poll_id>:<option_index>
          const parts = text.split(':');
          if (parts.length !== 3) continue;

          const pollId = parts[1];
          const optionIndex = parseInt(parts[2], 10);
          const userId = event.source.userId;
          
          if (!userId) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ไม่สามารถบันทึกโหวตได้ กรุณาแอดบอทเป็นเพื่อนก่อนโหวตนะจ้ะ 😢' }], lineToken);
            continue;
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          // 1. Check if poll exists and is not expired
          const { data: poll, error: pollError } = await supabase
            .from('custom_polls')
            .select('*')
            .eq('id', pollId)
            .single();

          if (pollError || !poll) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ไม่พบโพลนี้ในระบบจ้า 😢' }], lineToken);
            continue;
          }

          const now = new Date();
          const endTime = new Date(poll.end_time);

          if (now > endTime) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'โพลนี้หมดเวลาโหวตไปแล้วจ้า 😢' }], lineToken);
            continue;
          }

          const votedForText = poll.options[optionIndex];
          if (!votedForText) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ตัวเลือกนี้ไม่มีในโพลจ้า 😢' }], lineToken);
            continue;
          }

          // 2. Upsert vote
          const { error: voteError } = await supabase
            .from('custom_poll_votes')
            .upsert({ poll_id: pollId, user_id: userId, voted_for: votedForText }, { onConflict: 'poll_id,user_id' });

          if (voteError) {
            console.error('Error saving vote:', voteError);
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการบันทึกโหวต กรุณาลองใหม่ 😢' }], lineToken);
          } else {
            await replyToLine(event.replyToken, [{ type: 'text', text: `บันทึกโหวต "${votedForText}" เรียบร้อยแล้วจ้า 🎉` }], lineToken);
          }
          continue;
        }

        // ถ้าพิมพ์คำว่า "สรุปโพล:xxx"
        if (text.startsWith('สรุปโพล:')) {
          const pollId = text.replace('สรุปโพล:', '').trim();
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          // 1. Fetch poll details
          const { data: poll, error: pollError } = await supabase
            .from('custom_polls')
            .select('*')
            .eq('id', pollId)
            .single();

          if (pollError || !poll) {
            await replyToLine(event.replyToken, [{ type: 'text', text: 'ไม่พบโพลนี้ในระบบจ้า 😢' }], lineToken);
            continue;
          }

          // 2. Fetch votes
          const { data: votes, error: votesError } = await supabase
            .from('custom_poll_votes')
            .select('voted_for')
            .eq('poll_id', pollId);

          if (votesError) {
            console.error('Error fetching votes:', votesError);
            await replyToLine(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการดึงข้อมูลโหวต 😢' }], lineToken);
            continue;
          }

          const now = new Date();
          const endTime = new Date(poll.end_time);
          const isEnded = now > endTime;

          let summaryText = `📊 สรุปผลโพล: ${poll.question}\n${isEnded ? '(หมดเวลาโหวตแล้ว)' : '(ยังเปิดโหวตอยู่)'}\n\n`;

          if (!votes || votes.length === 0) {
            summaryText += 'ยังไม่มีคนโหวตเลยจ้า 🥺';
            await replyToLine(event.replyToken, [{ type: 'text', text: summaryText }], lineToken);
            continue;
          }

          const voteCounts = votes.reduce((acc: any, vote) => {
            acc[vote.voted_for] = (acc[vote.voted_for] || 0) + 1;
            return acc;
          }, {});

          // Sort by count descending
          const sortedVotes = Object.entries(voteCounts).sort((a: any, b: any) => b[1] - a[1]);
          
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

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
        
        // --- Offline Check ---
        const isCommand = text.startsWith('พริมจ๋า') || text === 'คำสั่งเพิ่มเติม' || text.startsWith('โหวตโพล:') || text.startsWith('สรุปโพล:');
        if (isCommand) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { data: statusSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'primja_status')
            .single();

          if (statusSetting?.value === 'offline') {
            const { data: timeSetting } = await supabase
              .from('system_settings')
              .select('value')
              .eq('key', 'primja_offline_until')
              .single();

            let offlineMsg = 'พริมจ๋ากำลังปรับปรุงระบบอยู่จ้า 🛠️\nเดี๋ยวมาใหม่นะ';
            if (timeSetting?.value) {
              const untilDate = new Date(timeSetting.value);
              offlineMsg = `พริมจ๋ากำลังปรับปรุงระบบอยู่จ้า 🛠️\nคาดว่าจะกลับมาใช้งานได้เวลา: ${untilDate.toLocaleString('th-TH')}`;
            }

            await replyToLine(event.replyToken, [{ type: 'text', text: offlineMsg }], lineToken);
            continue;
          }
        }
        // ----------------------

        // ถ้าพิมพ์คำว่า "พริมจ๋า ดูไอดี" หรือ "พริมจ๋าดูไอดี"
        if (text === 'พริมจ๋า ดูไอดี' || text === 'พริมจ๋าดูไอดี') {
          const groupId = event.source.groupId || event.source.roomId;
          const replyText = groupId ? `Group ID ของกลุ่มนี้คือ:\n${groupId}` : 'ไม่ได้อยู่ในกลุ่มจ้า (นี่คือแชทส่วนตัว)';
          
          await replyToLine(event.replyToken, [{ type: 'text', text: replyText }], lineToken);
          continue;
        }

        // New funny commands
        if (text === 'พลอยจี') {
          const texts = [
            'ระบบ AI พลอยจี กำลังประมวลผล... อุ๊วะฮะฮ่า เจี๊ยกๆ อุกๆ กรู๊ววว! 🤖🐒',
            'AI พลอยจี ตรวจพบความเหงา... ทำการปล่อยคลื่นเสียง: อุกๆ เจี๊ยกๆ แคร่กๆ! 🍌',
            'Hello Human. I am AI Ployjee. อุบ๊ะ เจี๊ยกกกๆๆๆ อู้วววววว 🤖🐒',
            'ระบบขัดข้อง... beep boop... เจี๊ยกๆๆๆๆ อุกๆๆๆ แฮ่! 🐒',
            'AI พลอยจี สแตนด์บาย! พร้อมส่งเสียงร้อง: เจี๊ยกๆๆ อุกๆๆๆ กิ้วๆๆ! 🐵'
          ];
          const randomText = texts[Math.floor(Math.random() * texts.length)];
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('พลอยจี 🐵', randomText, '✨', '#f59e0b');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'อัยย์แจ๋') {
          const texts = [
            'ระนาดเอก: เป็นเครื่องดนตรีประเภทตี ทำหน้าที่เป็นผู้นำวง มีเสียงสดใสและกังวาน 🎶',
            'จะเข้: เครื่องดนตรีประเภทดีด มี 3 สาย นิยมเล่นในวงมโหรีและเครื่องสาย 🐊',
            'ฆ้องวงใหญ่: เป็นหลักของวงปี่พาทย์ มีลูกฆ้อง 16 ลูก ตีเป็นทำนองหลัก 🎵',
            'ซอด้วง: เครื่องสีที่มีเสียงแหลม กระบอกซอทำจากไม้เนื้อแข็งหรืองาช้าง 🎻',
            'ขลุ่ยเพียงออ: เครื่องเป่าทำจากไม้รวก มีเสียงไพเราะ นุ่มนวล 🌬️'
          ];
          const randomText = texts[Math.floor(Math.random() * texts.length)];
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('อัยย์แจ๋ 🎵', randomText, '✨', '#3b82f6');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'ยูกิจือ') {
          const texts = [
            'Skibidi Toilet คือสงครามระหว่างโถส้วมมีหัวคนร้องเพลง Skibidi Bop Bop Yes Yes กับกองทัพตากล้อง (Cameraman) 🚽🎥',
            'Italian Brainrot คือมุกตลกปั่นๆ สไตล์อิตาลี ที่คนชอบเอามาทำมีมกาวๆ 🍝🤪',
            'Sigma Male rule #1: อย่าไปสนใจ Skibidi Toilet มากเดี๋ยวสมองไหลนะน้องนะ 🗿🍷',
            'What the dog doin? อ๋อ หมาไปดู Skibidi Toilet อยู่ 🐕🚽',
            'โอ้มายก้อด บราเธอร์! นี่มัน Italian Brainrot ชัดๆ ไปกินพิซซ่าใส่สับปะรดแป๊บ 🍕🍍'
          ];
          const randomText = texts[Math.floor(Math.random() * texts.length)];
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ยูกิจือ 🚽', randomText, '✨', '#8b5cf6');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'ออสตินจีจ้าบูกิ๊ก') {
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ออสตินจีจ้าบูกิ๊ก 🤍', 'ไม่เป็นไรนะ เรื่องแค่นี้เอง เราให้อภัยเสมอ ปล่อยวางเถอะ', '✨', '#ec4899');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'ดินปืนปู๊ดแป่ว') {
          const today = new Date();
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' };
          const thDateString = today.toLocaleDateString('th-TH', options);
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ดินปืนปู๊ดแป่ว ☀️', `อรุณสวัสดิ์จ้า! วันนี้คือ ${thDateString} ขอให้เป็นวันที่ดีนะ`, '✨', '#f59e0b');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'ฟอสเฟี้ยวฟ้าว') {
          const texts = [
            'เมนูวันนี้น่ารักสุดๆ: นมสดสตรอว์เบอร์รีปั่นหวานน้อย ท็อปด้วยไอศกรีมวานิลลาและวิปครีมเรนโบว์ 🍓🍦✨',
            'เมนูแบ๊วๆ: ชาเขียวมัทฉะปั่น ใส่บุกไข่มุกสีพาสเทล พร้อมมาชเมลโล่นุ่มฟู 🍵🍡',
            'เมนูคาวาอี้: นมหมีปั่นคาราเมล หมีพูห์ยังต้องยอมแพ้ พร้อมวิปครีมล้นๆ 🐻🍯',
            'เมนูฟรุ้งฟริ้ง: โซดาป๊อปอวกาศสีม่วงวิ้งๆ ใส่เยลลี่รูปดาวและพระจันทร์ 🌌⭐',
            'เมนูน่ารักกรุบกริบ: แพนเค้กมินิราดน้ำผึ้ง ทานคู่กับสมูทตี้พีชหอมละมุน 🥞🍑'
          ];
          const randomText = texts[Math.floor(Math.random() * texts.length)];
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ฟอสเฟี้ยวฟ้าว 🍰', randomText, '✨', '#ef4444');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'แสตมป์') {
          const dirtyToilets = [
            'ส้วมสาธารณะริมทางรถไฟอินเดีย คราบตะไคร่น้ำเกาะเต็มกำแพง พร้อมกองอึปริศนาที่ยังอุ่นๆ 🚂💩',
            'ส้วมหลุมกลางป่าดงดิบ แมลงวันบินว่อนนับพันตัว กลิ่นหมักหมมทะลุแมสก์ 🪰🌲',
            'ห้องน้ำร้างในเชอร์โนบิล คราบตะกรันสีเขียวเรืองแสง แถมมีคราบเหลืองๆ หยดจากเพดาน ☢️🤢',
            'ส้วมปั๊มร้างชานเมืองที่ไม่ได้ล้างมา 10 ปี ขี้ลอยฟ่องเต็มคอห่าน กดชักโครกไม่ลง น้ำเจิ่งนองเต็มพื้น 🚽💦',
            'ส้วมซึมแตกๆ ในตรอกมืด มีหนอนยั้วเยี้ยในร่องกระเบื้อง และกองกระดาษชำระใช้แล้วเปียกแฉะ 🐛🧻',
            'ห้องน้ำสถานีรถไฟใต้ดินนิวยอร์ก กลิ่นฉี่ฉุนกึกเตะจมูก มีคราบสไลม์เหนียวหนืดเกาะที่ขอบฝารองนั่ง 🚇☣️'
          ];
          const lat = (Math.random() * 180 - 90).toFixed(4);
          const lng = (Math.random() * 360 - 180).toFixed(4);
          const randomToilet = dirtyToilets[Math.floor(Math.random() * dirtyToilets.length)];
          
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('แสตมป์ 🚽', `กำลังสแกนหาพิกัดห้องน้ำทั่วโลก...\n\n📍 พิกัด: ${lat}°, ${lng}°\n\nสภาพที่พบ: ${randomToilet}`, '✨', '#10b981');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text === 'ตาล ทวงเงิน' || text === 'ตาลจ๋า ทวงเงิน' || text === 'ตาลทวงทำไม' || text === 'ตาลทวงยับ') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          function getMonday(d: Date) {
            d = new Date(d);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            return d.toISOString().split('T')[0];
          }
          const weekStart = getMonday(new Date());

          const { data: fundsData } = await supabase
            .from('class_funds')
            .select('*')
            .eq('week_start_date', weekStart);

          const funds = fundsData || [];
          const paidCount = funds.filter((f: any) => f.is_paid).length;
          
          const allStudents = Array.from({ length: 52 }, (_, i) => i + 1);
          const unpaidStudents = allStudents.filter(s => {
            const f = funds.find((f: any) => f.student_number === s);
            return !f || !f.is_paid;
          });

          const { data: allFundsData } = await supabase
            .from('class_funds')
            .select('amount')
            .eq('is_paid', true);
          
          const totalFunds = (allFundsData || []).reduce((acc: number, f: any) => acc + Number(f.amount), 0);

          const { createFundsFlexMessage } = await import('@/utils/line/flex');
          const weekLabel = new Date(weekStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
          
          const isHardcore = text === 'ตาลทวงยับ';
          const flexMsg = createFundsFlexMessage(paidCount, unpaidStudents, totalFunds, weekLabel, isHardcore);
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }

        if (text === 'ชิน') {
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ชิน', 'ว่าวเซส', '✨', '#6b7280');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }
        if (text.includes('ฉงฉึกฉัก') || text === 'ฉง') {
          const { createFunnyFlexMessage } = await import('@/utils/line/flex');
          const flexMsg = createFunnyFlexMessage('ฉงฉึกฉัก 🧬', 'ชาย ชาย ชาย ชาย ชาย น้องเคยเห็นชายหรือป่าว ชายนั้นไข่ใหญ่ไม่เบา อันทะของเขาสร้าง sperm', '✨', '#0ea5e9');
          await replyToLine(event.replyToken, [flexMsg], lineToken);
          continue;
        }

        // ถ้าพิมพ์คำว่า "คำสั่งเพิ่มเติม"
        if (text === 'คำสั่งเพิ่มเติม') {
          const replyText = `คู่มือการใช้งานของชามนพิ\nสามารถพิมพ์คำสั่งเหล่านี้ในแชทได้เลยคราบ\n\n🔹 "พริมจ๋า" - เรียกเมนูหลัก\n🔹 "พริมจ๋า งานวันนี้" - ดูงานที่ต้องส่งวันนี้\n🔹 "พริมจ๋า งานค้าง" - ดูงานที่เลยกำหนดแล้ว\n🔹 "พริมจ๋า สรุปงาน" - ดูงานทั้งหมด\n🔹 "พริมจ๋าวันนี้ใส่ชุดไร" - ดูชุดนักเรียน\n🔹 "พริมจ๋า วันนี้ใครเวร" - ดูเวรทำความสะอาด\n🔹 "พริมจ๋า ต่อไปคาบไร" - ดูวิชาเรียนคาบต่อไป\n🔹 "พริมจ๋า พรุ่งนี้เรียนไร" - ดูตารางเรียน\n🔹 "พริมจ๋า เปลี่ยนหัวหน้า" - เปิดโหวตเปลี่ยนหัวหน้า\n🔹 "พริมจ๋า สรุปโหวตหัวหน้า" - ดูคะแนนโหวต\n🔹 "พริมจ๋า ดูไอดี" - ดูไอดีกลุ่ม\n\n🌟 คำสั่งปั่นๆ (แยกจากพริมจ๋า) 🌟\n🔸 "พลอยจี" - คุยแก้เหงา\n🔸 "อัยย์แจ๋" - ความรู้ดนตรีไทย\n🔸 "ยูกิจือ" - สาระ Skibidi Toilet\n🔸 "ออสตินจีจ้าบูกิ๊ก" - คำให้อภัย\n🔸 "ดินปืนปู๊ดแป่ว" - อรุณสวัสดิ์บอกวันที่\n🔸 "ฟอสเฟี้ยวฟ้าว" - สุ่มเมนูอาหาร\n🔸 "แสตมป์" - หาพิกัดห้องน้ำ\n🔸 "ชิน" - ว่างเปล่า\n🔸 "ฉงฉึกฉัก" หรือ "ฉง" - ฮอร์โมนเพศ`;
          
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

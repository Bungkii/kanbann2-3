import { NextResponse } from 'next/server';
import { createMenuFlexMessage } from '@/utils/line/flex';

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
        }
      }
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

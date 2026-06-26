import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is missing' }, { status: 500 });
    }

    const message = {
      type: 'text',
      text: `ดึกแล้ว ฝันดีนะจ๊ะ รักนะจุ๊บๆ 💖💤`
    };

    const groupId = process.env.LINE_GROUP_ID;
    const apiUrl = groupId 
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';
      
    const bodyPayload = groupId
      ? { to: groupId, messages: [message] }
      : { messages: [message] };

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

    return NextResponse.json({ success: true, message: '22:00 Goodnight broadcast sent' });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

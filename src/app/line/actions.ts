'use server';

export async function sendCustomLineMessage(text: string) {
  if (!text || text.trim() === '') {
    return { error: 'กรุณาพิมพ์ข้อความที่ต้องการส่ง' };
  }

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) {
    return { error: 'ไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN' };
  }

  const groupId = process.env.LINE_GROUP_ID;
  const apiUrl = groupId 
    ? 'https://api.line.me/v2/bot/message/push'
    : 'https://api.line.me/v2/bot/message/broadcast';
    
  const bodyPayload = groupId
    ? { to: groupId, messages: [{ type: 'text', text }] }
    : { messages: [{ type: 'text', text }] };

  try {
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
      return { error: `ส่งไม่สำเร็จ: ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Send custom LINE message error:', error);
    return { error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE API' };
  }
}

import { createClient } from '@supabase/supabase-js';
import { createCustomPollFlexMessage } from '@/utils/line/flex';

export async function createCustomPoll(question: string, options: string[], endTimeStr: string) {
  if (!question || options.length < 2 || !endTimeStr) {
    return { error: 'กรุณากรอกข้อมูลโพลให้ครบถ้วน (คำถาม, ตัวเลือกอย่างน้อย 2 ข้อ, เวลาปิดโหวต)' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert poll to database
  const { data: poll, error: insertError } = await supabase
    .from('custom_polls')
    .insert([{ question, options, end_time: new Date(endTimeStr).toISOString() }])
    .select('id')
    .single();

  if (insertError || !poll) {
    console.error('Error creating poll in DB:', insertError);
    return { error: 'เกิดข้อผิดพลาดในการสร้างโพลลงฐานข้อมูล' };
  }

  // 2. We no longer send Push message to save quota. Instead, we return a success flag that tells the UI to instruct the user.
  return { success: true, requireTrigger: true, pollId: poll.id };
}

export async function getPrimjaStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: statusData } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'primja_status')
    .single();

  const { data: timeData } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'primja_offline_until')
    .single();

  return {
    status: statusData?.value || 'active',
    offlineUntil: timeData?.value || null
  };
}

export async function setPrimjaStatus(status: 'active' | 'offline', offlineUntil?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const updates: { key: string, value: string, updated_at: string }[] = [
    { key: 'primja_status', value: status, updated_at: new Date().toISOString() },
  ];

  if (status === 'offline' && offlineUntil) {
    updates.push({ key: 'primja_offline_until', value: offlineUntil, updated_at: new Date().toISOString() });
  } else if (status === 'active') {
    updates.push({ key: 'primja_offline_until', value: '', updated_at: new Date().toISOString() });
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert(updates);

  if (error) {
    console.error('Error setting status:', error);
    return { error: 'เกิดข้อผิดพลาดในการบันทึกสถานะ' };
  }
  return { success: true };
}


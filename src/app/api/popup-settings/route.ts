import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['popup_image_url', 'popup_link_url']);

    if (error) {
      return NextResponse.json({ popup_image_url: '', popup_link_url: '' });
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row) => {
      // value can be JSONB string like "\"https://...\"" or plain string
      let val = row.value;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch { /* keep as is */ }
      }
      settings[row.key] = typeof val === 'string' ? val : '';
    });

    return NextResponse.json({
      popup_image_url: settings.popup_image_url || '',
      popup_link_url: settings.popup_link_url || '',
    });
  } catch (err) {
    return NextResponse.json({ popup_image_url: '', popup_link_url: '' });
  }
}

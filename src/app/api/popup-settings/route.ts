import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0;

function normalizeValue(raw: any): any {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean' || typeof raw === 'number' || Array.isArray(raw) || typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return raw; }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['popup_images', 'popup_image_url', 'popup_link_url']);

    if (error) {
      return NextResponse.json({ popup_images: [] });
    }

    const settings: Record<string, any> = {};
    (data || []).forEach((row) => {
      settings[row.key] = normalizeValue(row.value);
    });

    // Return array from new popup_images key
    if (Array.isArray(settings.popup_images) && settings.popup_images.length > 0) {
      return NextResponse.json({ popup_images: settings.popup_images });
    }

    // Backward compat: migrate old single popup_image_url
    if (settings.popup_image_url) {
      return NextResponse.json({
        popup_images: [{
          image_url: settings.popup_image_url,
          link_url: settings.popup_link_url || '',
        }],
      });
    }

    return NextResponse.json({ popup_images: [] });
  } catch {
    return NextResponse.json({ popup_images: [] });
  }
}

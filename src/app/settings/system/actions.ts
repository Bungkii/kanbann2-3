"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: normalize a raw DB value to JS value
// Handles both text columns (old schema) and JSONB columns (new schema)
function normalizeValue(raw: any): any {
  if (raw === null || raw === undefined) return null;
  // Already a JS primitive (JSONB col already parsed by supabase-js)
  if (typeof raw === 'boolean' || typeof raw === 'number' || typeof raw === 'object') return raw;
  // It's a string — could be stringified JSON from a text column
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // plain string
    }
  }
  return raw;
}

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');

  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }

  const settings: Record<string, any> = {};
  (data || []).forEach((row) => {
    settings[row.key] = normalizeValue(row.value);
  });

  return settings;
}

export async function updateSystemSetting(key: string, value: any) {
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating setting:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/system');
  revalidatePath('/add');
  revalidatePath('/kanban');
  revalidatePath('/summaries');
  revalidatePath('/election');
  revalidatePath('/evaluate-boss');
  revalidatePath('/');
  return { success: true };
}

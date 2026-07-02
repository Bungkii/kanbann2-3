'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getExamSummaries() {
  const { data, error } = await supabase
    .from('exam_summaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching summaries:', error);
    return { error: 'ไม่สามารถดึงข้อมูลสรุปสอบได้' };
  }

  return { summaries: data };
}

'use server';

import { createClient } from '@supabase/supabase-js';

function getSummariesClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(supabaseUrl, supabaseKey);
}

export async function getExamSummaries() {
  const supabase = getSummariesClient();
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

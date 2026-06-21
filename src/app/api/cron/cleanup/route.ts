import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // We need service role key to bypass RLS if there are any restrictions, 
    // but assuming anon key has delete access since this is a simple kanban or we use service role if available.
    // Let's check if SUPABASE_SERVICE_ROLE_KEY is in env, otherwise fallback to anon
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Calculate the date 180 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180);
    const cutoffIsoString = cutoffDate.toISOString();

    const { data, error } = await supabase
      .from('homework_tasks')
      .delete()
      .lt('created_at', cutoffIsoString)
      .select();

    if (error) {
      console.error('Error deleting old tasks:', error);
      return NextResponse.json({ error: 'Failed to delete old tasks' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Cleanup complete', deletedCount: data?.length || 0 });
  } catch (error) {
    console.error('Cron cleanup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

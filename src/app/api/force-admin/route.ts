import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const emailsToAdmin = [
    'bungkii@bungkii.com',
    'bungkii.paerew@gmail.com',
    '30260@student.act.ac.th'
  ];

  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const results = [];

  for (const email of emailsToAdmin) {
    const user = users.find(u => u.email === email);
    if (user) {
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
      
      if (upsertError) {
        results.push({ email, status: 'error', message: upsertError.message });
      } else {
        results.push({ email, status: 'success' });
      }
    } else {
      results.push({ email, status: 'not_found', message: 'User has not signed in yet.' });
    }
  }

  return NextResponse.json({ results });
}

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const emailsToAdmin = [
  'bungkii@bungkii.com',
  'bungkii.paerew@gmail.com',
  '30260@student.act.ac.th'
];

async function run() {
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  for (const email of emailsToAdmin) {
    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`Found user for ${email}: ${user.id}`);
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
      
      if (upsertError) {
        console.error(`Failed to give admin to ${email}:`, upsertError);
      } else {
        console.log(`✅ Granted Admin role to ${email}`);
      }
    } else {
      console.log(`⚠️ User not found for email: ${email}`);
    }
  }
}

run();

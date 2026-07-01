'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
    
  return roleData?.role || 'user'
}

export async function assignSelfRole(role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if role exists
  const { data: existing } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existing) return { error: 'Role already assigned' }

  const { error } = await supabase
    .from('user_roles')
    .insert([{ user_id: user.id, role }])

  if (error) return { error: error.message }
  return { success: true }
}

export async function getFundsForWeek(weekStartDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_funds')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .order('student_number', { ascending: true })

  if (error) {
    console.error('Error fetching funds:', error)
    return []
  }
  
  return data || []
}

export async function getTotalFunds() {
  const supabase = await createClient()
  // sum all paid amounts
  const { data, error } = await supabase
    .from('class_funds')
    .select('amount')
    .eq('is_paid', true)

  let total = 0
  if (!error && data) {
    total = data.reduce((sum, item) => sum + Number(item.amount), 0)
  }
  
  const { data: adjData } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'funds_balance_adjustment')
    .single()
    
  const adjustment = Number(adjData?.value) || 0
  
  return total + adjustment
}

export async function setFundsBalanceAdjustment(amount: number) {
  const role = await getUserRole()
  if (role !== 'admin' && role !== 'tuang') return { error: 'Unauthorized' }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)
  
  const { error } = await adminSupabase
    .from('system_settings')
    .upsert({ key: 'funds_balance_adjustment', value: amount.toString() })
    
  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  return { success: true }
}

export async function toggleFundStatus(weekStartDate: string, studentNumber: number, isPaid: boolean, amount: number = 20) {
  const supabase = await createClient()
  const role = await getUserRole()
  
  if (role !== 'admin' && role !== 'tuang') {
    return { error: 'Unauthorized. Only admin or tuang can update funds.' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Use service role to bypass RLS since we already validated the role in server code
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const { error } = await adminSupabase
    .from('class_funds')
    .upsert({
      week_start_date: weekStartDate,
      student_number: studentNumber,
      is_paid: isPaid,
      amount: amount,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    }, {
      onConflict: 'week_start_date,student_number'
    })

  if (error) {
    console.error('Upsert error:', error)
    return { error: `DB Error: ${error.message}` }
  }
  
  revalidatePath('/funds')
  return { success: true }
}

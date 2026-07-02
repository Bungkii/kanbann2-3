'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function getFundsData() {
  const supabase = await createClient()
  const { data: fundsData, error: fundsError } = await supabase
    .from('class_funds')
    .select('amount')
    .eq('is_paid', true)

  let sumPaid = 0
  if (!fundsError && fundsData) {
    sumPaid = fundsData.reduce((sum, item) => sum + Number(item.amount), 0)
  }
  
  const { data: adjData } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'funds_balance_adjustment')
    .single()
    
  const adjustment = Number(adjData?.value) || 0

  const { data: expensesData, error: expError } = await supabase
    .from('class_expenses')
    .select('amount')

  let sumExpenses = 0
  if (!expError && expensesData) {
    sumExpenses = expensesData.reduce((sum, item) => sum + Number(item.amount), 0)
  }
  
  return {
    sumPaid,
    adjustment,
    sumExpenses,
    totalFunds: sumPaid + adjustment - sumExpenses
  }
}

export async function getExpenses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_expenses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
  return data || []
}

export async function addExpense(amount: number, description: string, receiptUrl: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาล็อกอินก่อน' }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const { error } = await adminSupabase
    .from('class_expenses')
    .insert({
      amount,
      description,
      receipt_url: receiptUrl,
      created_by: user.id
    })

  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาล็อกอินก่อน' }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const { error } = await adminSupabase
    .from('class_expenses')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  return { success: true }
}

export async function getTotalFunds() {
  const { totalFunds } = await getFundsData()
  return totalFunds
}

export async function setFundsBalanceAdjustment(amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาล็อกอินก่อน' }
  
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'กรุณาล็อกอินก่อน' }
  }

  // Use service role to bypass RLS
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

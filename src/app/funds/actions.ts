'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentStudentSession } from '@/utils/studentAuth'
import { revalidatePath } from 'next/cache'

/**
 * Checks if the current request is from an authenticated user (Supabase Auth OR Student Session).
 */
async function getAuthenticatedOperator() {
  const studentSession = await getCurrentStudentSession()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !studentSession) {
    return null
  }

  return {
    userId: user?.id || (studentSession ? `student-${studentSession.student_id}` : null),
    role: studentSession?.role || (user?.user_metadata?.role as string) || 'Student',
    studentSession,
    user,
  }
}

function isValidUUID(id?: string | null): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function normalizeValue(raw: any): any {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed
    } catch {
      return raw
    }
  }
  return raw
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
  const operator = await getAuthenticatedOperator()
  if (!operator) return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const createdBy = operator.user && isValidUUID(operator.user.id) ? operator.user.id : null

  const { error } = await adminSupabase
    .from('class_expenses')
    .insert({
      amount,
      description,
      receipt_url: receiptUrl,
      created_by: createdBy
    })

  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  revalidatePath('/parent/funds')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const operator = await getAuthenticatedOperator()
  if (!operator) return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

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
  revalidatePath('/parent/funds')
  return { success: true }
}

export async function getTotalFunds() {
  const { totalFunds } = await getFundsData()
  return totalFunds
}

export async function setFundsBalanceAdjustment(amount: number) {
  const operator = await getAuthenticatedOperator()
  if (!operator) return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)
  
  const { error } = await adminSupabase
    .from('system_settings')
    .upsert({ 
      key: 'funds_balance_adjustment', 
      value: amount,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    
  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  revalidatePath('/parent/funds')
  return { success: true }
}

export async function getFundsSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['funds_start_date', 'funds_end_date', 'final_exam_date'])
    
  let startDate = null
  let endDate = null
  let finalExamDate = null
  
  data?.forEach(item => {
    const val = normalizeValue(item.value)
    if (item.key === 'funds_start_date') startDate = typeof val === 'string' ? val : (val ? String(val) : null)
    if (item.key === 'funds_end_date') endDate = typeof val === 'string' ? val : (val ? String(val) : null)
    if (item.key === 'final_exam_date') finalExamDate = typeof val === 'string' ? val : (val ? String(val) : null)
  })
  
  // Also query distinct recorded weeks from class_funds
  const { data: weekData } = await supabase
    .from('class_funds')
    .select('week_start_date')
  
  const recordedWeeks: string[] = Array.from(new Set((weekData || []).map((w: any) => w.week_start_date).filter(Boolean)))

  return { startDate, endDate, finalExamDate, recordedWeeks }
}

export async function setFundsSettings(startDate: string, endDate: string, finalExamDate: string) {
  const operator = await getAuthenticatedOperator()
  if (!operator) return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)
  
  const now = new Date().toISOString()
  const updates = [
    { key: 'funds_start_date', value: startDate, updated_at: now },
    { key: 'funds_end_date', value: endDate, updated_at: now },
    { key: 'final_exam_date', value: finalExamDate, updated_at: now }
  ]
  
  const { error } = await adminSupabase
    .from('system_settings')
    .upsert(updates, { onConflict: 'key' })
    
  if (error) return { error: error.message }
  
  revalidatePath('/funds')
  revalidatePath('/parent/funds')
  return { success: true }
}

export async function toggleFundStatus(weekStartDate: string, studentNumber: number, isPaid: boolean, amount: number = 20) {
  const operator = await getAuthenticatedOperator()
  if (!operator) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  // Use service role to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const updatedBy = operator.user && isValidUUID(operator.user.id) ? operator.user.id : null

  const { error } = await adminSupabase
    .from('class_funds')
    .upsert({
      week_start_date: weekStartDate,
      student_number: studentNumber,
      is_paid: isPaid,
      amount: amount,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    }, {
      onConflict: 'week_start_date,student_number'
    })

  if (error) {
    console.error('Upsert error:', error)
    return { error: `DB Error: ${error.message}` }
  }
  
  revalidatePath('/funds')
  revalidatePath('/parent/funds')
  return { success: true }
}

/**
 * Resets the class funds cycle:
 * 1. Preserves net remaining balance by converting it to the new Starting Balance Adjustment (funds_balance_adjustment).
 * 2. Keeps 100% of all expense history (class_expenses).
 * 3. Clears old student payment records (class_funds).
 * 4. Sets new cycle dates (funds_start_date, funds_end_date, final_exam_date).
 */
export async function resetFundsCycleAction(params?: {
  newStartDate?: string | null;
  newEndDate?: string | null;
  newExamDate?: string | null;
}) {
  const operator = await getAuthenticatedOperator()
  if (!operator) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  // 1. Calculate current fund statistics
  const currentFunds = await getFundsData()
  const currentRemainingBalance = currentFunds.totalFunds
  const currentExpenses = currentFunds.sumExpenses

  // Accounting formula:
  // totalFunds = sumPaid + adjustment - sumExpenses
  // When class_funds is cleared, sumPaid becomes 0.
  // To preserve currentRemainingBalance:
  // currentRemainingBalance = 0 + newAdjustment - currentExpenses
  // => newAdjustment = currentRemainingBalance + currentExpenses
  const newAdjustment = currentRemainingBalance + currentExpenses

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

  // 2. Clear all student weekly payments in class_funds
  const { error: clearFundsError } = await adminSupabase
    .from('class_funds')
    .delete()
    .gte('student_number', 0)

  if (clearFundsError) {
    console.error('Error clearing class_funds:', clearFundsError)
    return { error: `เกิดข้อผิดพลาดในการล้างประวัติการเก็บเงิน: ${clearFundsError.message}` }
  }

  // 3. Upsert new adjustment and new cycle dates into system_settings
  const now = new Date().toISOString()
  const settingsUpdates: Array<{ key: string; value: any; updated_at: string }> = [
    {
      key: 'funds_balance_adjustment',
      value: newAdjustment,
      updated_at: now,
    }
  ]

  if (params?.newStartDate) {
    settingsUpdates.push({ key: 'funds_start_date', value: params.newStartDate, updated_at: now })
  }
  if (params?.newEndDate) {
    settingsUpdates.push({ key: 'funds_end_date', value: params.newEndDate, updated_at: now })
  }
  if (params?.newExamDate) {
    settingsUpdates.push({ key: 'final_exam_date', value: params.newExamDate, updated_at: now })
  }

  const { error: settingsError } = await adminSupabase
    .from('system_settings')
    .upsert(settingsUpdates, { onConflict: 'key' })

  if (settingsError) {
    console.error('Error updating system_settings:', settingsError)
    return { error: `เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ${settingsError.message}` }
  }

  revalidatePath('/funds')
  revalidatePath('/parent/funds')
  revalidatePath('/')
  return {
    success: true,
    remainingBalance: currentRemainingBalance,
    newAdjustment,
  }
}

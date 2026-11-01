'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentStudentSession } from '@/utils/studentAuth'

// Use service role key to bypass RLS (student auth is custom, not Supabase auth)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServiceClient(url, key)
}

export async function addTaskAction(formData: FormData) {
  const session = await getCurrentStudentSession()
  if (!session) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน' }
  }

  const subject = (formData.get('subject') as string)?.trim()
  const dueDate = formData.get('due_date') as string
  const details = (formData.get('details') as string)?.trim()
  const teacherName = (formData.get('teacher_name') as string)?.trim() || null
  const submissionMethod = (formData.get('submission_method') as string)?.trim() || null
  const maxScoreRaw = formData.get('max_score') as string
  const workType = (formData.get('work_type') as string) || 'individual'
  const groupSizeRaw = formData.get('group_size') as string
  const imageUrl = (formData.get('image_url') as string) || null
  const imageUrlsRaw = formData.get('image_urls') as string

  if (!subject || !dueDate || !details) {
    return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (วิชา, กำหนดส่ง, รายละเอียด)' }
  }

  let imageUrls: string[] | null = null
  try {
    if (imageUrlsRaw) imageUrls = JSON.parse(imageUrlsRaw)
  } catch {}

  const supabase = getAdminClient()

  const baseTask: Record<string, any> = {
    subject,
    due_date: new Date(dueDate).toISOString(),
    details,
    teacher_name: teacherName,
    submission_method: submissionMethod,
    image_url: imageUrl,
    image_urls: imageUrls,
    status: 'todo',
    work_type: workType,
    group_size: groupSizeRaw ? parseInt(groupSizeRaw) : null,
    max_score: maxScoreRaw ? parseFloat(maxScoreRaw) : null,
  }

  // Attempt insert with created_by
  let insertPayload: Record<string, any> = {
    ...baseTask,
    created_by: session.student_id,
  }

  let { error } = await supabase.from('homework_tasks').insert([insertPayload])

  // Fallback 1: If 'created_by' column does not exist in schema cache yet
  if (error && error.message.includes("'created_by'")) {
    console.warn('[addTaskAction] created_by column missing in schema cache, retrying without created_by')
    insertPayload = { ...baseTask }
    const retry = await supabase.from('homework_tasks').insert([insertPayload])
    error = retry.error
  }

  // Fallback 2: If 'image_urls' column does not exist in schema cache yet
  if (error && error.message.includes("'image_urls'")) {
    console.warn('[addTaskAction] image_urls column missing in schema cache, retrying without image_urls')
    delete insertPayload.image_urls
    const retry = await supabase.from('homework_tasks').insert([insertPayload])
    error = retry.error
  }

  if (error) {
    console.error('[addTaskAction] Supabase error:', error)
    return { error: `บันทึกไม่สำเร็จ: ${error.message}` }
  }

  revalidatePath('/kanban')
  revalidatePath('/add')
  return { success: true }
}

export async function updateTaskDetailsAction(
  taskId: string,
  data: {
    subject: string
    due_date: string
    details: string
    teacher_name: string | null
    submission_method: string | null
    image_url?: string | null
    image_urls?: string[] | null
  }
) {
  const session = await getCurrentStudentSession()
  if (!session) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const supabase = getAdminClient()
  let updateData: Record<string, any> = { ...data }
  let { error } = await supabase.from('homework_tasks').update(updateData).eq('id', taskId)

  if (error && error.message.includes("'image_urls'")) {
    console.warn('[updateTaskDetailsAction] image_urls missing in schema cache, retrying without it')
    delete updateData.image_urls
    const retry = await supabase.from('homework_tasks').update(updateData).eq('id', taskId)
    error = retry.error
  }

  if (error) {
    console.error('[updateTaskDetailsAction] error:', error)
    return { error: error.message }
  }

  revalidatePath('/kanban')
  return { success: true }
}

export async function deleteTaskAction(taskId: string) {
  const session = await getCurrentStudentSession()
  if (!session) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const supabase = getAdminClient()
  const { error } = await supabase.from('homework_tasks').delete().eq('id', taskId)

  if (error) {
    console.error('[deleteTaskAction] error:', error)
    return { error: error.message }
  }

  revalidatePath('/kanban')
  return { success: true }
}

/**
 * Returns unique teacher names from existing tasks for autocomplete.
 */
export async function getExistingTeacherNames(): Promise<string[]> {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('homework_tasks')
    .select('teacher_name')
    .not('teacher_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!data) return []
  const seen = new Set<string>()
  const names: string[] = []
  for (const row of data) {
    const name = (row.teacher_name as string)?.trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  }
  return names
}


/**
 * Parses homework text with Gemini 3.5 Flash Lite
 */
export async function parseHomeworkWithAiAction(rawText: string) {
  const session = await getCurrentStudentSession()
  if (!session) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  try {
    const { parseHomeworkWithGemini } = await import('@/utils/geminiTaskParser')
    const result = await parseHomeworkWithGemini(rawText)
    return { success: true, tasks: result.tasks, modelUsed: result.modelUsed }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อความ' }
  }
}

/**
 * Saves AI-parsed tasks directly into the database
 */
export async function getAiHomeworkDraftAction(draftId: string) {
  const session = await getCurrentStudentSession()
  if (!session) return { error: 'กรุณาเข้าสู่ระบบก่อน' }
  if (!/^[0-9a-f-]{36}$/i.test(draftId)) return { error: 'ลิงก์ไม่ถูกต้อง' }
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('ai_homework_drafts').select('tasks, model_used, status, expires_at').eq('id', draftId).single()
  if (error || !data || data.status !== 'pending' || new Date(data.expires_at) <= new Date()) return { error: 'รายการนี้หมดอายุหรือบันทึกแล้ว' }
  return { tasks: data.tasks, modelUsed: data.model_used }
}

export async function saveAiParsedTasksAction(tasks: any[], draftId?: string) {
  const session = await getCurrentStudentSession()
  if (!session) return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' }

  try {
    const supabase = getAdminClient()
    if (draftId) {
      const { data: claimed } = await supabase.from('ai_homework_drafts').update({ status: 'processing' }).eq('id', draftId).eq('status', 'pending').gt('expires_at', new Date().toISOString()).select('id').single()
      if (!claimed) return { success: false, error: 'รายการนี้หมดอายุหรือบันทึกแล้ว' }
    }
    const { saveParsedTasksToDatabase } = await import('@/utils/geminiTaskParser')
    const result = await saveParsedTasksToDatabase(tasks, session.student_id)
    if (draftId) await supabase.from('ai_homework_drafts').update({ status: result.success ? 'saved' : 'pending' }).eq('id', draftId)
    if (result.success) {
      revalidatePath('/kanban')
      revalidatePath('/add')
    }
    return result
  } catch (err: any) {
    return { success: false, error: err.message || 'บันทึกไม่สำเร็จ' }
  }
}

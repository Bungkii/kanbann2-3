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

  const { error } = await supabase.from('homework_tasks').insert([{
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
    created_by: session.student_id,
  }])

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
  const { error } = await supabase.from('homework_tasks').update(data).eq('id', taskId)

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

'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Use service role key to bypass RLS — student auth uses custom JWT, not Supabase auth
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key)
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('homework_tasks')
    .update({ status: newStatus })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task status:', error)
    return { error: error.message }
  }

  revalidatePath('/kanban')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('homework_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return { error: error.message }
  }

  revalidatePath('/kanban')
  return { success: true }
}

export async function updateTaskDetails(
  taskId: string, 
  data: {
    subject: string;
    due_date: string;
    details: string;
    teacher_name: string | null;
    submission_method: string | null;
    image_url?: string | null;
    image_urls?: string[] | null;
  }
) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('homework_tasks')
    .update(data)
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task details:', error)
    return { error: error.message }
  }

  revalidatePath('/kanban')
  return { success: true }
}

/**
 * Updates a student's personal task completion status (todo | in_progress | done)
 * and syncs it to the parent portal.
 */
export async function updateStudentTaskStatusAction(
  taskId: string,
  newStatus: 'todo' | 'in_progress' | 'done',
  studentIdOverride?: string
) {
  const { getCurrentStudentSession } = await import('@/utils/studentAuth');
  const { setStudentTaskCompletion } = await import('@/utils/studentTaskCompletions');

  let studentId = studentIdOverride;
  if (!studentId) {
    const session = await getCurrentStudentSession();
    if (session) {
      studentId = session.student_id;
    }
  }

  if (!studentId) {
    return { success: false, error: 'No student identified' };
  }

  const result = await setStudentTaskCompletion(studentId, taskId, newStatus);
  revalidatePath('/kanban');
  revalidatePath('/parent/assignments');
  return { ...result, studentId };
}

/**
 * Reads all personal task completion statuses for a student.
 */
export async function getStudentTaskCompletionsAction(studentId: string) {
  const { getStudentTaskCompletions } = await import('@/utils/studentTaskCompletions');
  return await getStudentTaskCompletions(studentId);
}


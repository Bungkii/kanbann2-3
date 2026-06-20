'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  }
) {
  const supabase = await createClient()

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

import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface StudentTaskCompletionRecord {
  id?: string;
  student_id: string;
  task_id: string;
  status: TaskStatus;
  completed_at?: string;
  updated_at?: string;
}

const COMPLETIONS_FILE = path.join(process.cwd(), 'src', 'data', 'student_task_completions.json');

async function getFs() {
  const { default: fs } = await import('fs/promises');
  return fs;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
  try {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

/**
 * Reads completions from local JSON file fallback
 */
async function readLocalCompletions(): Promise<StudentTaskCompletionRecord[]> {
  try {
    const fs = await getFs();
    const content = await fs.readFile(COMPLETIONS_FILE, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Saves completions to local JSON file
 */
async function saveLocalCompletions(records: StudentTaskCompletionRecord[]): Promise<void> {
  try {
    const fs = await getFs();
    await fs.writeFile(COMPLETIONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local student task completions:', err);
  }
}

/**
 * Gets all task completion statuses for a given student.
 * Returns a dictionary mapping taskId -> status ('todo' | 'in_progress' | 'done')
 */
export async function getStudentTaskCompletions(
  studentId: string
): Promise<Record<string, TaskStatus>> {
  const cleanId = (studentId || '').trim();
  if (!cleanId) return {};

  const map: Record<string, TaskStatus> = {};

  // 1. Try Supabase first
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_task_completions')
        .select('task_id, status')
        .eq('student_id', cleanId);

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          map[row.task_id] = row.status as TaskStatus;
        });
        return map;
      }
    } catch {
      // Fallback to local
    }
  }

  // 2. Fallback to local JSON
  const localRecords = await readLocalCompletions();
  localRecords
    .filter((r) => r.student_id === cleanId)
    .forEach((r) => {
      map[r.task_id] = r.status;
    });

  return map;
}

/**
 * Upserts a completion record for a student and task.
 */
export async function setStudentTaskCompletion(
  studentId: string,
  taskId: string,
  status: TaskStatus
): Promise<{ success: boolean; error?: string }> {
  const cleanStudentId = (studentId || '').trim();
  const cleanTaskId = (taskId || '').trim();

  if (!cleanStudentId || !cleanTaskId) {
    return { success: false, error: 'Student ID and Task ID are required' };
  }

  const now = new Date().toISOString();

  // 1. Try Supabase
  let supabaseSuccess = false;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const payload: any = {
        student_id: cleanStudentId,
        task_id: cleanTaskId,
        status,
        updated_at: now,
      };
      if (status === 'done') {
        payload.completed_at = now;
      }

      const { error } = await supabase
        .from('student_task_completions')
        .upsert(payload, { onConflict: 'student_id,task_id' });

      if (!error) {
        supabaseSuccess = true;
      }
    } catch (err: any) {
      console.warn('Supabase upsert failed, continuing with local store:', err?.message);
    }
  }

  // 2. Always persist into local JSON file as backup & local cache
  try {
    const localRecords = await readLocalCompletions();
    const existingIndex = localRecords.findIndex(
      (r) => r.student_id === cleanStudentId && r.task_id === cleanTaskId
    );

    if (existingIndex >= 0) {
      localRecords[existingIndex].status = status;
      localRecords[existingIndex].updated_at = now;
      if (status === 'done') {
        localRecords[existingIndex].completed_at = now;
      }
    } else {
      localRecords.push({
        student_id: cleanStudentId,
        task_id: cleanTaskId,
        status,
        completed_at: status === 'done' ? now : undefined,
        updated_at: now,
      });
    }

    await saveLocalCompletions(localRecords);
  } catch (err: any) {
    console.error('Local JSON save failed:', err);
    if (!supabaseSuccess) {
      return { success: false, error: err?.message || 'Failed to save completion' };
    }
  }

  return { success: true };
}

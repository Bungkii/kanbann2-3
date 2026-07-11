'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type ExamTopic = {
  id: string;
  subject: string;
  teacher: string;
  topics: string[];
  mcq_count?: number;
  essay_count?: number;
  created_at?: string;
  updated_at?: string;
};

export async function getExamTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_topics')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching exam topics:', error);
    return [];
  }

  return data as ExamTopic[];
}

export async function addExamTopic(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const subject = formData.get('subject') as string;
  const teacher = formData.get('teacher') as string;
  const topicsString = formData.get('topics') as string;
  const mcqCountStr = formData.get('mcq_count') as string;
  const essayCountStr = formData.get('essay_count') as string;

  if (!subject || !teacher || !topicsString) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
  }

  const topics = topicsString.split('\n').map(t => t.trim()).filter(t => t.length > 0);
  const mcq_count = parseInt(mcqCountStr) || 0;
  const essay_count = parseInt(essayCountStr) || 0;

  const { error } = await supabase
    .from('exam_topics')
    .insert({
      subject,
      teacher,
      topics,
      mcq_count,
      essay_count
    });

  if (error) {
    console.error('Error adding exam topic:', error);
    return { success: false, error: 'ไม่สามารถบันทึกข้อมูลได้' };
  }

  revalidatePath('/exam-topics');
  revalidatePath('/exam-topics/manage');
  return { success: true };
}

export async function updateExamTopic(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const subject = formData.get('subject') as string;
  const teacher = formData.get('teacher') as string;
  const topicsString = formData.get('topics') as string;
  const mcqCountStr = formData.get('mcq_count') as string;
  const essayCountStr = formData.get('essay_count') as string;

  if (!subject || !teacher || !topicsString) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
  }

  const topics = topicsString.split('\n').map(t => t.trim()).filter(t => t.length > 0);
  const mcq_count = parseInt(mcqCountStr) || 0;
  const essay_count = parseInt(essayCountStr) || 0;

  const { error } = await supabase
    .from('exam_topics')
    .update({
      subject,
      teacher,
      topics,
      mcq_count,
      essay_count,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating exam topic:', error);
    return { success: false, error: 'ไม่สามารถอัปเดตข้อมูลได้' };
  }

  revalidatePath('/exam-topics');
  revalidatePath('/exam-topics/manage');
  return { success: true };
}

export async function deleteExamTopic(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('exam_topics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting exam topic:', error);
    return { success: false, error: 'ไม่สามารถลบข้อมูลได้' };
  }

  revalidatePath('/exam-topics');
  revalidatePath('/exam-topics/manage');
  return { success: true };
}

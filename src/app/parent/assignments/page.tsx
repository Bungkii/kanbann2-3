import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import ParentAssignmentsClient, { Task } from '../components/ParentAssignmentsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'กระดานการบ้านและชิ้นงาน | ระบบติดตามงานห้อง ม.2/3',
  description: 'ตรวจสอบรายการการบ้าน กำหนดส่ง และสถานะงานของนักเรียนชั้น ม.2/3',
};

export default async function ParentAssignmentsPage() {
  const supabase = await createClient();

  const { data: rawTasks, error } = await supabase
    .from('homework_tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching homework tasks for parent:', error);
  }

  const tasks: Task[] = (rawTasks || []).map((t) => ({
    id: t.id,
    subject: t.subject || 'ไม่ระบุวิชา',
    details: t.details || '',
    due_date: t.due_date,
    teacher_name: t.teacher_name || null,
    submission_method: t.submission_method || null,
    status: t.status || 'todo',
    work_type: t.work_type || 'individual',
    group_size: t.group_size != null ? Number(t.group_size) : null,
    max_score: t.max_score != null ? Number(t.max_score) : null,
    image_url: t.image_url || null,
    image_urls: Array.isArray(t.image_urls) ? t.image_urls : (t.image_url ? [t.image_url] : []),
    created_at: t.created_at || undefined,
  }));

  return <ParentAssignmentsClient initialTasks={tasks} />;
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getCurrentStudentSession } from '@/utils/studentAuth';

function getSummariesClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(supabaseUrl, supabaseKey);
}

export type SummaryItem = {
  id: string;
  title: string;
  subject: string;
  description: string;
  file_url: string;
  file_urls?: string[];
  uploader_id?: string;
  uploader_name?: string;
  attachment_type?: string;
  link_url?: string;
  term?: string;
  created_at: string;
};

export async function getCurrentStudentForSummaries() {
  try {
    const session = await getCurrentStudentSession();
    if (!session) return null;
    return {
      student_id: session.student_id,
      student_no: session.student_no,
      full_name: session.full_name,
      nickname: session.nickname,
      role: session.role,
      canManageAll: ['SuperAdmin', 'Admin', 'Leader'].includes(session.role),
    };
  } catch {
    return null;
  }
}

export async function getExamSummaries() {
  try {
    const supabase = getSummariesClient();
    const { data, error } = await supabase
      .from('exam_summaries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching summaries:', error);
      return { error: 'ไม่สามารถดึงข้อมูลสรุปสอบได้' };
    }

    return { summaries: (data as SummaryItem[]) || [] };
  } catch (err: any) {
    console.error('Error in getExamSummaries:', err);
    return { error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปสอบ' };
  }
}

export async function getExamSummaryById(id: string) {
  try {
    const supabase = getSummariesClient();
    const { data, error } = await supabase
      .from('exam_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { error: 'ไม่พบข้อมูลสรุปสอบนี้' };
    }

    return { summary: data as SummaryItem };
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสรุปสอบ' };
  }
}

export async function createExamSummary(payload: {
  title: string;
  subject: string;
  description?: string;
  uploaderName?: string;
  attachmentType: 'file' | 'link';
  fileUrls?: string[];
  linkUrl?: string;
  term?: string;
}) {
  try {
    const session = await getCurrentStudentSession();
    if (!session) {
      return { error: 'กรุณาเข้าสู่ระบบด้วยบัญชีนักเรียนก่อนแชร์สรุปสอบ' };
    }

    const { title, subject, description, uploaderName, attachmentType, fileUrls, linkUrl, term } = payload;

    if (!title || !title.trim()) {
      return { error: 'กรุณาระบุชื่อสรุป' };
    }
    if (!subject || !subject.trim()) {
      return { error: 'กรุณาระบุวิชา' };
    }

    const uploadedUrls = fileUrls || [];
    const isLink = attachmentType === 'link';

    if (isLink && !linkUrl?.trim()) {
      return { error: 'กรุณาระบุลิงก์' };
    }

    if (!isLink && uploadedUrls.length === 0) {
      return { error: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' };
    }

    const supabase = getSummariesClient();

    const insertData: any = {
      title: title.trim(),
      subject: subject.trim(),
      description: (description || '').trim(),
      uploader_id: session.student_id,
      uploader_name: (uploaderName || '').trim() || session.full_name || session.nickname || null,
      attachment_type: attachmentType,
      term: term || '1/69',
      file_url: isLink ? linkUrl!.trim() : (uploadedUrls[0] || ''),
      file_urls: isLink ? [] : uploadedUrls,
    };

    if (isLink) {
      insertData.link_url = linkUrl!.trim();
    }

    const { data, error } = await supabase
      .from('exam_summaries')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting exam summary:', error);
      return { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสรุปสอบ: ' + error.message };
    }

    revalidatePath('/summaries');
    revalidatePath('/parent/exams');
    return { success: true, summary: data };
  } catch (err: any) {
    console.error('Error in createExamSummary:', err);
    return { error: err.message || 'เกิดข้อผิดพลาดในการบันทึกสรุปสอบ' };
  }
}

export async function updateExamSummary(
  id: string,
  payload: {
    title: string;
    subject: string;
    description?: string;
    uploaderName?: string;
    linkUrl?: string;
    attachmentType?: string;
  }
) {
  try {
    const session = await getCurrentStudentSession();
    if (!session) {
      return { error: 'กรุณาเข้าสู่ระบบก่อนแก้ไขสรุปสอบ' };
    }

    const supabase = getSummariesClient();

    // Check existing
    const { data: existing, error: fetchErr } = await supabase
      .from('exam_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { error: 'ไม่พบข้อมูลสรุปสอบนี้' };
    }

    const canEdit =
      ['SuperAdmin', 'Admin', 'Leader'].includes(session.role) ||
      existing.uploader_id === session.student_id ||
      existing.uploader_id === `student_${session.student_id}`;

    if (!canEdit) {
      return { error: 'คุณไม่มีสิทธิ์แก้ไขสรุปสอบนี้' };
    }

    const updateData: any = {
      title: payload.title.trim(),
      subject: payload.subject.trim(),
      description: (payload.description || '').trim(),
      uploader_name: (payload.uploaderName || '').trim() || null,
    };

    if (payload.attachmentType === 'link' || existing.attachment_type === 'link') {
      if (payload.linkUrl) {
        updateData.link_url = payload.linkUrl.trim();
        updateData.file_url = payload.linkUrl.trim();
      }
    }

    const { error: updateErr } = await supabase
      .from('exam_summaries')
      .update(updateData)
      .eq('id', id);

    if (updateErr) {
      console.error('Error updating summary:', updateErr);
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + updateErr.message };
    }

    revalidatePath('/summaries');
    revalidatePath('/parent/exams');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสรุปสอบ' };
  }
}

export async function deleteExamSummary(id: string) {
  try {
    const session = await getCurrentStudentSession();
    if (!session) {
      return { error: 'กรุณาเข้าสู่ระบบก่อนลบสรุปสอบ' };
    }

    const supabase = getSummariesClient();

    // Check existing
    const { data: existing, error: fetchErr } = await supabase
      .from('exam_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { error: 'ไม่พบข้อมูลสรุปสอบนี้' };
    }

    const canDelete =
      ['SuperAdmin', 'Admin', 'Leader'].includes(session.role) ||
      existing.uploader_id === session.student_id ||
      existing.uploader_id === `student_${session.student_id}`;

    if (!canDelete) {
      return { error: 'คุณไม่มีสิทธิ์ลบสรุปสอบนี้ (เฉพาะผู้สร้างหรือผู้ดูแลระบบเท่านั้น)' };
    }

    const { error: deleteErr } = await supabase
      .from('exam_summaries')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.error('Error deleting summary:', deleteErr);
      return { error: 'เกิดข้อผิดพลาดในการลบสรุปสอบ: ' + deleteErr.message };
    }

    revalidatePath('/summaries');
    revalidatePath('/parent/exams');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการลบสรุปสอบ' };
  }
}

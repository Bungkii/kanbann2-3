import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getSystemSettings } from '@/app/settings/system/actions';
import ParentExamsClient, {
  ExamTopic,
  ExamSummary,
} from '../components/ParentExamsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'เนื้อหาออกสอบ & ไฟล์สรุป | ระบบติดตามงานห้อง ม.2/3',
  description: 'ตรวจสอบขอบเขตเนื้อหาที่ออกสอบและดาวน์โหลดไฟล์สรุปบทเรียนสำหรับนักเรียนชั้น ม.2/3',
};

export default async function ParentExamsPage() {
  const supabase = await createClient();

  // Fetch exam topics
  const { data: rawTopics, error: topicsError } = await supabase
    .from('exam_topics')
    .select('*')
    .order('created_at', { ascending: true });

  if (topicsError) {
    console.error('Error fetching exam topics for parent:', topicsError);
  }

  // Fetch exam summaries
  const { data: rawSummaries, error: summariesError } = await supabase
    .from('exam_summaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (summariesError) {
    console.error('Error fetching exam summaries for parent:', summariesError);
  }

  // Fetch system settings for exam countdown date
  const settings = await getSystemSettings();
  const finalExamDate = settings.final_exam_date
    ? `${settings.final_exam_date}T00:00:00+07:00`
    : '2026-09-22T00:00:00+07:00';

  // Format topics safely
  const topics: ExamTopic[] = (rawTopics || []).map((topic) => {
    const rawList = Array.isArray(topic.topics) ? topic.topics : [];
    const isHtml =
      rawList.length === 1 &&
      typeof rawList[0] === 'string' &&
      rawList[0].includes('<');

    return {
      id: topic.id,
      subject: topic.subject || 'ไม่ระบุวิชา',
      teacher: topic.teacher || 'ไม่ระบุผู้สอน',
      topics: rawList,
      mcq_count: topic.mcq_count != null ? Number(topic.mcq_count) : 0,
      essay_count: topic.essay_count != null ? Number(topic.essay_count) : 0,
      term: topic.term || '1/69',
      created_at: topic.created_at || undefined,
      updated_at: topic.updated_at || undefined,
      sanitizedHtml: isHtml ? rawList[0] : null,
    };
  });

  // Format summaries safely
  const summaries: ExamSummary[] = (rawSummaries || []).map((summary) => ({
    id: summary.id,
    title: summary.title || 'ไม่มีชื่อเอกสาร',
    subject: summary.subject || 'ทั่วไป',
    description: summary.description || null,
    file_url: summary.file_url || '',
    file_urls: Array.isArray(summary.file_urls) ? summary.file_urls : undefined,
    uploader_name: summary.uploader_name || null,
    attachment_type: summary.attachment_type || 'file',
    link_url: summary.link_url || null,
    term: summary.term || null,
    created_at: summary.created_at || new Date().toISOString(),
  }));

  return (
    <ParentExamsClient
      topics={topics}
      summaries={summaries}
      finalExamDate={finalExamDate}
    />
  );
}

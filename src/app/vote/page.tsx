import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getStudentSessionFromCookies } from '@/utils/studentSession';
import { createClient } from '@/utils/supabase/server';
import studentsData from '@/data/students.json';
import VoteClient from './VoteClient';

export const metadata: Metadata = {
  title: 'ระบบลงมติและแสดงตน | พริมจ๋า ม.2/3',
  description: 'ระบบลงคะแนนเสียง ตรวจสอบองค์ประชุม และอภิปราย สภาห้องเรียน ม.2/3',
};

export default async function VotePage() {
  const cookieStore = await cookies();
  
  // 1. Try reading student session from primja_session cookie
  const studentSession = getStudentSessionFromCookies(cookieStore as any);
  
  let initialStudent = null;
  if (studentSession && studentSession.student_id) {
    const matched = (studentsData as any[]).find((s) => s.student_id === studentSession.student_id);
    initialStudent = matched || {
      student_id: studentSession.student_id,
      student_no: studentSession.student_no,
      prefix: studentSession.prefix,
      first_name: studentSession.first_name,
      last_name: studentSession.last_name,
      nickname: studentSession.nickname,
      full_name: studentSession.full_name,
    };
  }

  // 2. If no student cookie, check Supabase user metadata
  if (!initialStudent) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const studentId = user.user_metadata?.student_id || user.email?.split('@')[0];
        if (studentId) {
          const matched = (studentsData as any[]).find((s) => s.student_id === String(studentId));
          if (matched) initialStudent = matched;
        }
      }
    } catch {
      // ignore
    }
  }

  return <VoteClient initialStudent={initialStudent} />;
}

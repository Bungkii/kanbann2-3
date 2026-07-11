import { getExamTopics } from './actions';
import { createClient } from '@/utils/supabase/server';
import ExamTopicsClient from './ExamTopicsClient';

export const revalidate = 0;

export default async function ExamTopicsPage() {
  let isLoggedIn = false;
  let examTopics: any[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch (e) {
    console.error('Error checking auth:', e);
  }

  try {
    examTopics = await getExamTopics();
  } catch (e) {
    console.error('Error fetching exam topics:', e);
  }

  // Safely prepare topics for client - no sanitize-html needed
  const safeTops = (examTopics || []).map(topic => {
    const topics = Array.isArray(topic.topics) ? topic.topics : [];
    const isHtml = topics.length === 1 && typeof topics[0] === 'string' && topics[0].includes('<');
    return {
      id: topic.id || '',
      subject: topic.subject || '',
      teacher: topic.teacher || '',
      topics: topics,
      mcq_count: topic.mcq_count ?? 0,
      essay_count: topic.essay_count ?? 0,
      created_at: topic.created_at || null,
      updated_at: topic.updated_at || null,
      sanitizedHtml: isHtml ? topics[0] : null,
    };
  });

  return <ExamTopicsClient topics={safeTops} isLoggedIn={isLoggedIn} />;
}

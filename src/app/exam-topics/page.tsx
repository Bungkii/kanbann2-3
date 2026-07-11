import { getExamTopics } from './actions';
import { createClient } from '@/utils/supabase/server';
import sanitizeHtml from 'sanitize-html';
import ExamTopicsClient from './ExamTopicsClient';

export const revalidate = 0;

export default async function ExamTopicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const examTopics = await getExamTopics();

  // Pre-sanitize HTML content on the server before passing to client
  const sanitizedTopics = examTopics.map(topic => {
    const topics = topic.topics || [];
    const isHtml = topics.length === 1 && (topics[0] || '').includes('<');
    return {
      ...topic,
      sanitizedHtml: isHtml
        ? sanitizeHtml(topics[0] || '', {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
            allowedAttributes: {
              ...sanitizeHtml.defaults.allowedAttributes,
              'p': ['style'],
              'span': ['style'],
            },
          })
        : null,
    };
  });

  return <ExamTopicsClient topics={sanitizedTopics} isLoggedIn={!!user} />;
}

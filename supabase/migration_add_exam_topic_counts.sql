-- Add mcq_count and essay_count to exam_topics
ALTER TABLE exam_topics ADD COLUMN IF NOT EXISTS mcq_count integer DEFAULT 0;
ALTER TABLE exam_topics ADD COLUMN IF NOT EXISTS essay_count integer DEFAULT 0;

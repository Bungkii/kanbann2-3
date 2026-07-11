-- Migration Script to Remove Role Restrictions (Make it open to all authenticated users)

-- 1. Remove Role Restrictions from Homework Tasks
DROP POLICY IF EXISTS "Allow admin and jod insert access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod update access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod delete access" ON homework_tasks;

CREATE POLICY "Allow authenticated insert access" ON homework_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON homework_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON homework_tasks FOR DELETE TO authenticated USING (true);

-- 2. Remove Role Restrictions from Exam Summaries (Update/Delete)
-- Note: Insert was already available to all authenticated users
DROP POLICY IF EXISTS "Allow users to update own exam_summaries or admin" ON exam_summaries;
DROP POLICY IF EXISTS "Allow users to delete own exam_summaries or admin" ON exam_summaries;

CREATE POLICY "Allow authenticated users to update exam_summaries" ON exam_summaries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete exam_summaries" ON exam_summaries FOR DELETE TO authenticated USING (true);

-- 3. Remove Role Restrictions from Storage Bucket (exam-summaries)
DROP POLICY IF EXISTS "Authenticated users can update own exam summaries or admin" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own exam summaries or admin" ON storage.objects;

CREATE POLICY "Authenticated users can update exam summaries" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'exam-summaries');
CREATE POLICY "Authenticated users can delete exam summaries" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'exam-summaries');

-- Migration: Remove role system + Add multi-file support
-- Run this in Supabase SQL Editor

-- 1. Add file_urls column to exam_summaries
ALTER TABLE exam_summaries ADD COLUMN IF NOT EXISTS file_urls text[];

-- 2. Migrate existing file_url data to file_urls
UPDATE exam_summaries 
SET file_urls = ARRAY[file_url] 
WHERE file_url IS NOT NULL AND (file_urls IS NULL OR array_length(file_urls, 1) IS NULL);

-- 3. Add image_urls column to homework_tasks
ALTER TABLE homework_tasks ADD COLUMN IF NOT EXISTS image_urls text[];

-- 4. Migrate existing image_url data to image_urls
UPDATE homework_tasks 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

-- 5. Drop role-based policies on class_funds and replace with open authenticated access
DROP POLICY IF EXISTS "Allow admin and tuang to manage class_funds" ON class_funds;
DROP POLICY IF EXISTS "Allow public read access on class_funds" ON class_funds;
DROP POLICY IF EXISTS "Allow authenticated all access on class_funds" ON class_funds;

CREATE POLICY "Allow public read access on class_funds" ON class_funds FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on class_funds" ON class_funds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Drop role-based policies on homework_tasks and make open for authenticated
DROP POLICY IF EXISTS "Allow admin and jod insert access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod update access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod delete access" ON homework_tasks;

CREATE POLICY "Allow authenticated insert access" ON homework_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON homework_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON homework_tasks FOR DELETE TO authenticated USING (true);

-- 7. Update exam_summaries policies to be open for authenticated
DROP POLICY IF EXISTS "Allow authenticated users to insert exam_summaries" ON exam_summaries;
DROP POLICY IF EXISTS "Allow users to update own exam_summaries or admin" ON exam_summaries;
DROP POLICY IF EXISTS "Allow users to delete own exam_summaries or admin" ON exam_summaries;

CREATE POLICY "Allow authenticated users to insert exam_summaries" ON exam_summaries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update exam_summaries" ON exam_summaries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete exam_summaries" ON exam_summaries FOR DELETE TO authenticated USING (true);

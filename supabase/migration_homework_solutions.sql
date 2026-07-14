-- ============================================================
-- MIGRATION: HOMEWORK SOLUTIONS (ระบบลอกการบ้าน)
-- ============================================================

CREATE TABLE IF NOT EXISTS homework_solutions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid REFERENCES homework_tasks(id) ON DELETE CASCADE NOT NULL,
    uploader_name text NOT NULL,
    image_url text NOT NULL,
    description text,
    liked_by text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE homework_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on homework_solutions" ON homework_solutions;
CREATE POLICY "Allow public all access on homework_solutions" ON homework_solutions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS homework_solution_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    solution_id uuid REFERENCES homework_solutions(id) ON DELETE CASCADE NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE homework_solution_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on homework_solution_comments" ON homework_solution_comments;
CREATE POLICY "Allow public all access on homework_solution_comments" ON homework_solution_comments FOR ALL USING (true) WITH CHECK (true);

-- อนุญาตให้ Public อัปโหลดรูปภาพลง bucket homework-images ได้
DROP POLICY IF EXISTS "Public users can upload images" ON storage.objects;
CREATE POLICY "Public users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'homework-images');

-- ============================================================
-- FULL SETUP SQL สำหรับ kanbann2-3 (ฉบับสมบูรณ์ 2025)
-- วิธีใช้: เปิด Supabase > SQL Editor > วาง SQL นี้ > Run
-- ============================================================

-- ============================================================
-- 1. HOMEWORK TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS homework_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    details text NOT NULL,
    image_url text,
    teacher_name text,
    submission_method text,
    status text DEFAULT 'todo'::text,
    work_type text DEFAULT 'individual'::text,
    group_size integer,
    max_score numeric,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE homework_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow authenticated update access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod insert access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod update access" ON homework_tasks;
DROP POLICY IF EXISTS "Allow admin and jod delete access" ON homework_tasks;

CREATE POLICY "Allow public read access" ON homework_tasks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert access" ON homework_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON homework_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON homework_tasks FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 2. SYSTEM SETTINGS
-- ============================================================
-- ถ้ามีตารางเก่าที่ value เป็น text ให้แปลงเป็น JSONB ก่อน
-- (แปลง 'true'/'false' เป็น boolean JSON, อื่นๆ เป็น string JSON)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'value' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.system_settings 
    ALTER COLUMN value TYPE JSONB USING (
      CASE 
        WHEN value = 'true'  THEN 'true'::jsonb
        WHEN value = 'false' THEN 'false'::jsonb
        WHEN value ~ '^-?[0-9]+(\.[0-9]+)?$' THEN value::jsonb
        WHEN value ~ '^[\[{"]' THEN value::jsonb
        ELSE to_jsonb(value)
      END
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow any logged-in user to manage system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public all access on system_settings" ON public.system_settings;

CREATE POLICY "Allow public read access on system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow any logged-in user to manage system_settings" ON public.system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ค่าเริ่มต้น system settings (key ต้องตรงกับโค้ด)
INSERT INTO public.system_settings (key, value) VALUES
    ('boss_evaluation_enabled', 'true'::jsonb),
    ('maintenance_mode_enabled', 'false'::jsonb),
    ('announcement_enabled', 'false'::jsonb),
    ('announcement_text', '""'::jsonb),
    ('primja_status', '"online"'::jsonb),
    ('add_work_enabled', 'true'::jsonb),
    ('kanban_enabled', 'true'::jsonb),
    ('summaries_enabled', 'true'::jsonb),
    ('election_enabled', 'true'::jsonb),
    ('evaluate_boss_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. CANDIDATES (election)
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    image_url text,
    policy_text text,
    policy_image_url text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated insert on candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated update on candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated delete on candidates" ON candidates;

CREATE POLICY "Allow public read access on candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on candidates" ON candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on candidates" ON candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete on candidates" ON candidates FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 4. LEADER VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS leader_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE leader_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on leader_votes" ON leader_votes;
CREATE POLICY "Allow public all access on leader_votes" ON leader_votes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. CUSTOM POLLS
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_polls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question text NOT NULL,
    options text[] NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE custom_polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on custom_polls" ON custom_polls;
CREATE POLICY "Allow public all access on custom_polls" ON custom_polls FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS custom_poll_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id uuid REFERENCES custom_polls(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

ALTER TABLE custom_poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on custom_poll_votes" ON custom_poll_votes;
CREATE POLICY "Allow public all access on custom_poll_votes" ON custom_poll_votes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. UNIFORM SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS uniform_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer UNIQUE NOT NULL,
    day_name text NOT NULL,
    uniform_name text NOT NULL,
    theme_color text DEFAULT '#1E3A8A',
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE uniform_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on uniform_schedule" ON uniform_schedule;
DROP POLICY IF EXISTS "Allow authenticated all access on uniform_schedule" ON uniform_schedule;

CREATE POLICY "Allow public read access on uniform_schedule" ON uniform_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on uniform_schedule" ON uniform_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO uniform_schedule (day_of_week, day_name, uniform_name, theme_color) VALUES
    (1, 'วันจันทร์', 'ชุดนักเรียน', '#1E3A8A'),
    (2, 'วันอังคาร', 'ชุดนักเรียน', '#1E3A8A'),
    (3, 'วันพุธ', 'ชุดพละและเสื้อช้อป', '#15803D'),
    (4, 'วันพฤหัสบดี', 'ชุดนักเรียน', '#1E3A8A'),
    (5, 'วันศุกร์', 'ชุดนักเรียน', '#1E3A8A')
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================================
-- 7. CLEANING SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer UNIQUE NOT NULL,
    day_name text NOT NULL,
    cleaners text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on cleaning_schedule" ON cleaning_schedule;
DROP POLICY IF EXISTS "Allow authenticated all access on cleaning_schedule" ON cleaning_schedule;

CREATE POLICY "Allow public read access on cleaning_schedule" ON cleaning_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on cleaning_schedule" ON cleaning_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO cleaning_schedule (day_of_week, day_name, cleaners) VALUES
    (1, 'วันจันทร์', '-'),
    (2, 'วันอังคาร', '-'),
    (3, 'วันพุธ', '-'),
    (4, 'วันพฤหัสบดี', '-'),
    (5, 'วันศุกร์', '-')
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================================
-- 8. CLASS SCHEDULE (ตารางเรียน ม.2/3)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer NOT NULL,
    period integer NOT NULL,
    subject text NOT NULL,
    teacher text,
    UNIQUE(day_of_week, period)
);

ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on class_schedule" ON class_schedule;
DROP POLICY IF EXISTS "Allow authenticated all access on class_schedule" ON class_schedule;

CREATE POLICY "Allow public read access on class_schedule" ON class_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on class_schedule" ON class_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO class_schedule (day_of_week, period, subject, teacher) VALUES
    (1, 1, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
    (1, 2, 'CEL', 'Nicholas, Ollie, Kate'),
    (1, 3, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
    (1, 4, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
    (1, 5, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
    (1, 6, 'วิทยาการคำนวณ 2', 'ม.ธนพล'),
    (1, 7, 'วิทยาการคำนวณ 2', 'ม.ธนพล'),
    (1, 8, 'สอนเสริม', '-'),
    (2, 1, 'พื้นฐานดนตรี 3', 'มิสเนตรชนก'),
    (2, 2, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
    (2, 3, 'ภาษาไทย 3', 'ม.คมสันต์'),
    (2, 4, 'CEL', 'Nicholas, Ollie, Kate'),
    (2, 5, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
    (2, 6, 'มงฟอร์ตศึกษา 3', 'มิสจุฑามาศ'),
    (2, 7, 'ทักษะภาษาอังกฤษ', 'Mr. Joemar'),
    (2, 8, 'สอนเสริม', '-'),
    (3, 1, 'ทักษะภาษาอังกฤษ', 'Mr. Marlon'),
    (3, 2, 'CEL', 'Nicholas, Ollie, Kate'),
    (3, 3, 'สุข-พละ', 'ม.มาโนช บุญผ่องใส'),
    (3, 4, 'สุข-พละ', 'ม.มาโนช บุญผ่องใส'),
    (3, 5, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
    (3, 6, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
    (3, 7, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
    (3, 8, 'สอนเสริม', '-'),
    (4, 1, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
    (4, 2, 'ศิลปพื้นฐาน 3', 'ม.ปณวัชร'),
    (4, 3, 'ทักษะการปฏิบัติดนตรี 2', 'ม.ปริญญา/ม.วรรษรักษ์'),
    (4, 4, 'ภาษาไทย 3', 'ม.คมสันต์'),
    (4, 5, 'CEL', 'Nicholas, Ollie, Kate'),
    (4, 6, 'ลูกเสือ', '-'),
    (4, 7, 'ชมรม', '-'),
    (4, 8, 'สอนเสริม', '-'),
    (5, 1, 'สังคมศึกษา 3', 'มิสธนวรรณ'),
    (5, 2, 'CEL', 'Nicholas, Ollie, Kate'),
    (5, 3, 'ภาษาไทย 3', 'ม.คมสันต์'),
    (5, 4, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
    (5, 5, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
    (5, 6, 'สังคมศึกษา 3', 'มิสธนวรรณ'),
    (5, 7, 'การงานอาชีพ 3', 'มิสรุ่งนภา'),
    (5, 8, 'ประวัติศาสตร์ 3', 'ม.เตชพัฒน์')
ON CONFLICT (day_of_week, period) DO NOTHING;

-- ============================================================
-- 9. CLASS FUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS class_funds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date date NOT NULL,
    student_number integer NOT NULL CHECK (student_number >= 1 AND student_number <= 52),
    is_paid boolean DEFAULT false,
    amount numeric DEFAULT 20.00,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE(week_start_date, student_number)
);

ALTER TABLE class_funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on class_funds" ON class_funds;
DROP POLICY IF EXISTS "Allow admin and tuang to manage class_funds" ON class_funds;

CREATE POLICY "Allow public read access on class_funds" ON class_funds FOR SELECT USING (true);
CREATE POLICY "Allow admin and tuang to manage class_funds" ON class_funds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. EXAM SUMMARIES (ชีทสรุป)
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    subject text NOT NULL,
    description text,
    file_url text NOT NULL,
    uploader_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE exam_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on exam_summaries" ON exam_summaries;
DROP POLICY IF EXISTS "Allow authenticated users to insert exam_summaries" ON exam_summaries;
DROP POLICY IF EXISTS "Allow users to update own exam_summaries or admin" ON exam_summaries;
DROP POLICY IF EXISTS "Allow users to delete own exam_summaries or admin" ON exam_summaries;

CREATE POLICY "Allow public read access on exam_summaries" ON exam_summaries FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert exam_summaries" ON exam_summaries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to update own exam_summaries or admin" ON exam_summaries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow users to delete own exam_summaries or admin" ON exam_summaries FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 11. BOSS EVALUATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS boss_evaluations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluator_id text NOT NULL,
    scores jsonb NOT NULL DEFAULT '{}',
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(evaluator_id)
);

ALTER TABLE boss_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on boss_evaluations" ON boss_evaluations;
CREATE POLICY "Allow public all access on boss_evaluations" ON boss_evaluations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 12. EXAM TOPICS (เนื้อหาออกสอบ) *** ส่วนสำคัญ ***
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_topics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    teacher text NOT NULL,
    topics text[] NOT NULL DEFAULT '{}',
    mcq_count integer DEFAULT 0,
    essay_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated insert access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated update access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated delete access on exam_topics" ON exam_topics;

CREATE POLICY "Allow public read access on exam_topics" ON exam_topics FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert access on exam_topics" ON exam_topics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access on exam_topics" ON exam_topics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access on exam_topics" ON exam_topics FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 13. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-images', 'homework-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-summaries', 'exam-summaries', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to read images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to read exam summaries" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload exam summaries" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own exam summaries or admin" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own exam summaries or admin" ON storage.objects;

CREATE POLICY "Public access to read images" ON storage.objects FOR SELECT USING (bucket_id = 'homework-images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'homework-images');
CREATE POLICY "Authenticated users can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'homework-images');
CREATE POLICY "Authenticated users can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'homework-images');

CREATE POLICY "Public access to read exam summaries" ON storage.objects FOR SELECT USING (bucket_id = 'exam-summaries');
CREATE POLICY "Authenticated users can upload exam summaries" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exam-summaries');
CREATE POLICY "Authenticated users can update own exam summaries or admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'exam-summaries');
CREATE POLICY "Authenticated users can delete own exam summaries or admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'exam-summaries');

-- Create table for homework tasks
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

-- Enable Row Level Security
ALTER TABLE homework_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for access
-- Allow ANYONE (including public) to read tasks
CREATE POLICY "Allow public read access" ON homework_tasks FOR SELECT USING (true);
-- Allow admin and jod to insert, update, and delete
CREATE POLICY "Allow admin and jod insert access" ON homework_tasks FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'jod')
    )
);
CREATE POLICY "Allow admin and jod update access" ON homework_tasks FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'jod')
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'jod')
    )
);
CREATE POLICY "Allow admin and jod delete access" ON homework_tasks FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'jod')
    )
);

-- Create storage bucket for homework images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homework-images', 'homework-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for homework-images
-- Allow public access to read images
CREATE POLICY "Public access to read images" ON storage.objects FOR SELECT USING (bucket_id = 'homework-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'homework-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'homework-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'homework-images');

-- Create table for leader votes
CREATE TABLE IF NOT EXISTS leader_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable Row Level Security for leader_votes
ALTER TABLE leader_votes ENABLE ROW LEVEL SECURITY;

-- Allow public access to leader_votes for webhook operations
CREATE POLICY "Allow public all access on leader_votes" ON leader_votes FOR ALL USING (true) WITH CHECK (true);

-- Create table for system settings (e.g., poll end times)
CREATE TABLE IF NOT EXISTS system_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- Create table for custom polls
CREATE TABLE IF NOT EXISTS custom_polls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question text NOT NULL,
    options text[] NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for custom_polls
ALTER TABLE custom_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on custom_polls" ON custom_polls FOR ALL USING (true) WITH CHECK (true);

-- Create table for custom poll votes
CREATE TABLE IF NOT EXISTS custom_poll_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id uuid REFERENCES custom_polls(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security for custom_poll_votes
ALTER TABLE custom_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on custom_poll_votes" ON custom_poll_votes FOR ALL USING (true) WITH CHECK (true);

-- Allow public access to system_settings for webhook operations and client-side access
CREATE POLICY "Allow public all access on system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- Create table for election candidates
CREATE TABLE IF NOT EXISTS candidates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    image_url text,
    policy_text text,
    policy_image_url text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on candidates" ON candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on candidates" ON candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete on candidates" ON candidates FOR DELETE TO authenticated USING (true);

-- Create table for uniform schedule
CREATE TABLE IF NOT EXISTS uniform_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer UNIQUE NOT NULL, -- 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
    day_name text NOT NULL,
    uniform_name text NOT NULL,
    theme_color text DEFAULT '#1E3A8A',
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE uniform_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on uniform_schedule" ON uniform_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on uniform_schedule" ON uniform_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default uniform schedule
INSERT INTO uniform_schedule (day_of_week, day_name, uniform_name, theme_color) VALUES 
(1, 'วันจันทร์', 'ชุดนักเรียน', '#FFD700'),
(2, 'วันอังคาร', 'ชุดนักเรียน', '#FF69B4'),
(3, 'วันพุธ', 'ชุดพละและเสื้อช้อป', '#32CD32'),
(4, 'วันพฤหัสบดี', 'ชุดนักเรียน', '#FFA500'),
(5, 'วันศุกร์', 'ชุดนักเรียน', '#00BFFF')
ON CONFLICT (day_of_week) DO NOTHING;

-- Create table for cleaning schedule
CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer UNIQUE NOT NULL,
    day_name text NOT NULL,
    cleaners text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on cleaning_schedule" ON cleaning_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on cleaning_schedule" ON cleaning_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default cleaning schedule (empty string)
INSERT INTO cleaning_schedule (day_of_week, day_name, cleaners) VALUES 
(1, 'วันจันทร์', '-'),
(2, 'วันอังคาร', '-'),
(3, 'วันพุธ', '-'),
(4, 'วันพฤหัสบดี', '-'),
(5, 'วันศุกร์', '-')
ON CONFLICT (day_of_week) DO NOTHING;

-- Create table for class schedule
CREATE TABLE IF NOT EXISTS class_schedule (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week integer NOT NULL,
    period integer NOT NULL,
    subject text NOT NULL,
    teacher text,
    UNIQUE(day_of_week, period)
);

ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on class_schedule" ON class_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all access on class_schedule" ON class_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert class schedule for M.2/3
INSERT INTO class_schedule (day_of_week, period, subject, teacher) VALUES 
-- Monday
(1, 1, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
(1, 2, 'CEL', 'Nicholas, Ollie, Kate'),
(1, 3, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
(1, 4, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
(1, 5, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
(1, 6, 'วิทยาการคำนวณ 2', 'ม.ธนพล'),
(1, 7, 'วิทยาการคำนวณ 2', 'ม.ธนพล'),
(1, 8, 'สอนเสริม', '-'),

-- Tuesday
(2, 1, 'พื้นฐานดนตรี 3', 'มิสเนตรชนก'),
(2, 2, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
(2, 3, 'ภาษาไทย 3', 'ม.คมสันต์'),
(2, 4, 'CEL', 'Nicholas, Ollie, Kate'),
(2, 5, 'วิทยาศาสตร์ 3', 'ม.ธนากร'),
(2, 6, 'มงฟอร์ตศึกษา 3', 'มิสจุฑามาศ'),
(2, 7, 'ทักษะภาษาอังกฤษ', 'Mr. Joemar'),
(2, 8, 'สอนเสริม', '-'),

-- Wednesday
(3, 1, 'ทักษะภาษาอังกฤษ', 'Mr. Marlon'),
(3, 2, 'CEL', 'Nicholas, Ollie, Kate'),
(3, 3, 'สุข-พละ', 'ม.มาโนช บุญผ่องใส'),
(3, 4, 'สุข-พละ', 'ม.มาโนช บุญผ่องใส'),
(3, 5, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
(3, 6, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
(3, 7, 'STEM ACTIVITY 3', 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์'),
(3, 8, 'สอนเสริม', '-'),

-- Thursday
(4, 1, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
(4, 2, 'ศิลปพื้นฐาน 3', 'ม.ปณวัชร'),
(4, 3, 'ทักษะการปฏิบัติดนตรี 2', 'ม.ปริญญา/ม.วรรษรักษ์'),
(4, 4, 'ภาษาไทย 3', 'ม.คมสันต์'),
(4, 5, 'CEL', 'Nicholas, Ollie, Kate'),
(4, 6, 'ลูกเสือ', '-'),
(4, 7, 'ชมรม', '-'),
(4, 8, 'สอนเสริม', '-'),

-- Friday
(5, 1, 'สังคมศึกษา 3', 'มิสธนวรรณ'),
(5, 2, 'CEL', 'Nicholas, Ollie, Kate'),
(5, 3, 'ภาษาไทย 3', 'ม.คมสันต์'),
(5, 4, 'คณิตศาสตร์ 3', 'มิสเสาวลักษณ์'),
(5, 5, 'ภาษาอังกฤษ 3', 'ม.อัคเดช'),
(5, 6, 'สังคมศึกษา 3', 'มิสธนวรรณ'),
(5, 7, 'การงานอาชีพ 3', 'มิสรุ่งนภา'),
(5, 8, 'ประวัติศาสตร์ 3', 'ม.เตชพัฒน์')
ON CONFLICT (day_of_week, period) DO NOTHING;

-- Create table for user roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role text NOT NULL DEFAULT 'user' -- Roles: 'admin', 'jod', 'tuang', 'user'
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on user_roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage user_roles" ON user_roles FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);
-- Allow users to insert their own initial role if it doesn't exist (optional, for setup)
CREATE POLICY "Allow users to insert their own role" ON user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create table for class funds
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
CREATE POLICY "Allow public read access on class_funds" ON class_funds FOR SELECT USING (true);
-- Only admin and tuang can update/insert class_funds
CREATE POLICY "Allow admin and tuang to manage class_funds" ON class_funds FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'tuang')
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'tuang')
    )
);

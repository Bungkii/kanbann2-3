-- Create table for exam topics
CREATE TABLE IF NOT EXISTS exam_topics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    teacher text NOT NULL,
    topics text[] NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated insert access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated update access on exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Allow authenticated delete access on exam_topics" ON exam_topics;

-- Allow public read access
CREATE POLICY "Allow public read access on exam_topics" ON exam_topics FOR SELECT USING (true);

-- Allow authenticated users to insert, update, delete
CREATE POLICY "Allow authenticated insert access on exam_topics" ON exam_topics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access on exam_topics" ON exam_topics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access on exam_topics" ON exam_topics FOR DELETE TO authenticated USING (true);

-- Insert initial sample data
INSERT INTO exam_topics (subject, teacher, topics) VALUES 
('คณิตศาสตร์ 3', 'มิสเสาวลักษณ์', ARRAY['ระบบสมการเชิงเส้นสองตัวแปร', 'การแยกตัวประกอบของพหุนามดีกรีสอง', 'ทฤษฎีบทพีทาโกรัสและบทกลับ']),
('วิทยาศาสตร์ 3', 'ม.ธนากร', ARRAY['ระบบร่างกายมนุษย์ (ระบบหายใจ, ระบบขับถ่าย)', 'การแยกสารผสม', 'งานและพลังงาน']),
('ภาษาอังกฤษ 3', 'ม.อัคเดช', ARRAY['Present Simple & Continuous', 'Past Simple Tense', 'Vocabulary: Daily Life & Hobbies', 'Reading Comprehension']),
('ภาษาไทย 3', 'ม.คมสันต์', ARRAY['การแต่งกลอนสุภาพ', 'วรรณคดี: โคลงภาพพระราชพงศาวดาร', 'หลักการอ่านจับใจความสำคัญ']),
('สังคมศึกษา 3', 'มิสธนวรรณ', ARRAY['ภูมิศาสตร์ทวีปเอเชีย', 'การพัฒนาที่ยั่งยืน', 'หน้าที่พลเมืองดีตามวิถีประชาธิปไตย'])
ON CONFLICT DO NOTHING;

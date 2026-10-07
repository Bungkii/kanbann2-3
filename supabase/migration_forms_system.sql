-- =========================================================================
-- ระบบแบบสอบถามออนไลน์ (Forms & Surveys System) - ม.2/3 พริมจ๋า
-- สร้างตารางแบบสอบถาม (forms) และการตอบกลับ (form_responses)
-- สำหรับรันใน Supabase SQL Editor
-- =========================================================================

-- 1. ตารางแบบสอบถาม (Forms)
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    creator_id TEXT,                     -- เลขประจำตัวผู้สร้าง หรือ auth user id
    creator_name TEXT,                   -- ชื่อผู้สร้าง
    creator_role TEXT,                   -- ยศผู้สร้าง (Leader, Finance, Admin, SuperAdmin)
    is_active BOOLEAN DEFAULT true,       -- เปิด/ปิดรับคำตอบ
    allow_anonymous BOOLEAN DEFAULT false,-- อนุญาตให้ตอบแบบไม่ระบุตัวตนหรือไม่
    visibility TEXT DEFAULT 'public',     -- 'public' (ค้นหาและแสดงในรายการ) หรือ 'private' (ส่วนตัว เข้าถึงผ่านลิงก์เท่านั้น)
    max_points NUMERIC DEFAULT NULL,      -- คะแนนเต็มรวม (ถ้ามี)
    questions JSONB NOT NULL DEFAULT '[]'::jsonb
    -- questions schema:
    -- [
    --   {
    --     "id": "q1",
    --     "title": "คำถามข้อที่ 1",
    --     "type": "short_answer" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "rating" | "linear_scale" | "date" | "time" | "file_upload",
    --     "required": true,
    --     "options": ["ตัวเลือก 1", "ตัวเลือก 2"],
    --     "correct_answer": "คำตอบที่ถูกต้อง",
    --     "points": 5
    --   }
    -- ]
);

-- เพิ่มคอลัมน์ใหม่อัตโนมัติ (กรณีสร้างตารางไปแล้ว)
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS max_points NUMERIC DEFAULT NULL;

-- 2. ตารางบันทึกการส่งคำตอบ (Form Responses)
CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    respondent_id TEXT,                  -- เลขประจำตัวนักเรียน 5 หลัก (ถ้าไม่ระบุตัวตนจะเป็น null)
    respondent_name TEXT,                -- ชื่อนามสกุลนักเรียน
    answers JSONB NOT NULL DEFAULT '{}'::jsonb
    -- answers schema:
    -- {
    --   "q1": "คำตอบข้อ 1",
    --   "q2": ["ตัวเลือก ก", "ตัวเลือก ข"]
    -- }
);

-- ดัชนีเพื่อประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON public.forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_creator_id ON public.forms(creator_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at ON public.form_responses(created_at DESC);

-- 3. ตั้งค่า Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- นโยบายตาราง forms:
-- ทุกคนสามารถอ่านฟอร์มได้ (เพื่อเข้าไปตอบที่ /form?id=...)
DROP POLICY IF EXISTS "Allow public select on forms" ON public.forms;
CREATE POLICY "Allow public select on forms" ON public.forms
    FOR SELECT USING (true);

-- อนุญาตให้เพิ่ม แก้ไข ลบ ฟอร์มได้
DROP POLICY IF EXISTS "Allow all insert on forms" ON public.forms;
CREATE POLICY "Allow all insert on forms" ON public.forms
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on forms" ON public.forms;
CREATE POLICY "Allow all update on forms" ON public.forms
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all delete on forms" ON public.forms;
CREATE POLICY "Allow all delete on forms" ON public.forms
    FOR DELETE USING (true);

-- นโยบายตาราง form_responses:
-- นักเรียนทุกคนสามารถส่งคำตอบ (INSERT) ได้
DROP POLICY IF EXISTS "Allow public insert on form_responses" ON public.form_responses;
CREATE POLICY "Allow public insert on form_responses" ON public.form_responses
    FOR INSERT WITH CHECK (true);

-- ทุกคนสามารถอ่านคำตอบได้ (ผู้สร้างฟอร์มนำไปดูสถิติ/สรุป)
DROP POLICY IF EXISTS "Allow public select on form_responses" ON public.form_responses;
CREATE POLICY "Allow public select on form_responses" ON public.form_responses
    FOR SELECT USING (true);

-- 4. คำอธิบายตาราง
COMMENT ON TABLE public.forms IS 'ตารางแบบสอบถามสร้างโดยผู้มียศ ม.2/3';
COMMENT ON TABLE public.form_responses IS 'ตารางคำตอบแบบสอบถาม';

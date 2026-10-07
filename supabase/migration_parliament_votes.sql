-- =========================================================================
-- ระบบลงมติและตรวจสอบองค์ประชุม สภาห้องเรียน ม.2/3 (Parliament Vote System)
-- สำหรับรันใน Supabase SQL Editor
-- มีระบบตรวจสอบย้อนหลังและลบข้อมูลเก่าเกิน 60 วันอัตโนมัติ
-- =========================================================================

-- 1. สร้างตารางบันทึกการลงมติและองค์ประชุม
CREATE TABLE IF NOT EXISTS public.parliament_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    record_type TEXT NOT NULL,           -- 'QUORUM' (แสดงตน) หรือ 'VOTE' (ลงมติ)
    student_id TEXT NOT NULL,            -- เลขประจำตัวนักเรียน 5 หลัก (เช่น '30233', '30260')
    student_name TEXT,                   -- ชื่อ-นามสกุลนักเรียน
    agenda TEXT NOT NULL,                -- วาระการประชุม
    choice TEXT NOT NULL                 -- 'PRESENT', 'ABSENT', 'APPROVE', 'DISAPPROVE', 'ABSTAIN'
);

-- เพิ่มดัชนีเพื่อให้ค้นหาและเรียงลำดับได้รวดเร็ว
CREATE INDEX IF NOT EXISTS idx_parliament_votes_student_id ON public.parliament_votes (student_id);
CREATE INDEX IF NOT EXISTS idx_parliament_votes_created_at ON public.parliament_votes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parliament_votes_agenda ON public.parliament_votes (agenda);

-- 2. ตั้งค่า Row Level Security (RLS)
ALTER TABLE public.parliament_votes ENABLE ROW LEVEL SECURITY;

-- ให้นักเรียนและระบบสามารถเพิ่มข้อมูล (INSERT) ได้
DROP POLICY IF EXISTS "Allow public insert on parliament_votes" ON public.parliament_votes;
CREATE POLICY "Allow public insert on parliament_votes" ON public.parliament_votes
    FOR INSERT WITH CHECK (true);

-- ให้นักเรียนและแอดมินสามารถอ่านข้อมูล (SELECT) ได้
DROP POLICY IF EXISTS "Allow public select on parliament_votes" ON public.parliament_votes;
CREATE POLICY "Allow public select on parliament_votes" ON public.parliament_votes
    FOR SELECT USING (true);

-- 3. ฟังก์ชันและ Trigger สำหรับลบประวัติที่เก่าเกิน 60 วันอัตโนมัติ (60-day auto-purge)
CREATE OR REPLACE FUNCTION public.purge_expired_parliament_votes()
RETURNS TRIGGER AS $$
BEGIN
    -- ลบแถวที่มีอายุเกิน 60 วัน
    DELETE FROM public.parliament_votes
    WHERE created_at < NOW() - INTERVAL '60 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purge_parliament_votes ON public.parliament_votes;
CREATE TRIGGER trigger_purge_parliament_votes
    AFTER INSERT ON public.parliament_votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.purge_expired_parliament_votes();

-- 4. รันคำสั่งทำความสะอาดข้อมูลที่เก่าเกิน 60 วันทันที
DELETE FROM public.parliament_votes WHERE created_at < NOW() - INTERVAL '60 days';

-- 5. บันทึกคำอธิบายตาราง
COMMENT ON TABLE public.parliament_votes IS 'ตารางบันทึกการลงคะแนนและตรวจสอบองค์ประชุมสภา ม.2/3 จัดเก็บ 60 วัน';

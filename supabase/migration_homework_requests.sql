-- ============================================================
-- MIGRATION: HOMEWORK REQUESTS (เพิ่มระบบขอลอกงาน)
-- ============================================================

-- 1. เพิ่มคอลัมน์ post_type เพื่อแยกระหว่าง การแชร์ (share) และ การขอ (request)
ALTER TABLE homework_solutions ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'share';

-- 2. เปลี่ยน image_url ให้เป็นแบบเว้นว่างได้ (NULL) สำหรับกรณี 'request' ไม่จำเป็นต้องมีรูป
ALTER TABLE homework_solutions ALTER COLUMN image_url DROP NOT NULL;

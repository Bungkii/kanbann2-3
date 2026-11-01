-- ============================================================
-- MIGRATION: Add created_by & image_urls to homework_tasks
-- รันไฟล์นี้ใน Supabase SQL Editor หากต้องการบันทึกผู้สร้างงานและการรองรับหลายรูป
-- ============================================================

-- 1. เพิ่มคอลัมน์ created_by (เก็บรหัสนักเรียนที่เป็นคนสร้างงาน)
ALTER TABLE homework_tasks ADD COLUMN IF NOT EXISTS created_by text;

-- 2. เพิ่มคอลัมน์ image_urls (รองรับรูปภาพหลายรูป)
ALTER TABLE homework_tasks ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- 3. สั่งให้ Supabase (PostgREST) รีโหลดแคชของตารางทันที (แก้ปัญหา Schema Cache)
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- MIGRATION: MULTIPLE IMAGES (รองรับการอัปโหลดหลายรูป)
-- ============================================================

-- 1. เพิ่มคอลัมน์ image_urls เป็น array of text
ALTER TABLE homework_solutions ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- 2. ย้ายข้อมูลจาก image_url เดิมมาใส่ใน image_urls
-- (ตรวจสอบว่า image_url มีค่าและไม่เป็นค่าว่าง)
UPDATE homework_solutions
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- หมายเหตุ: ยังไม่ลบคอลัมน์ image_url เดิมเพื่อกันแอปพลิเคชันเวอร์ชันก่อนหน้าพัง

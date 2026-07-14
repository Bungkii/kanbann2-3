-- สคริปต์นี้ใช้สำหรับเพิ่มคอลัมน์ที่ขาดหายไปในตาราง homework_solutions

-- 1. เพิ่มคอลัมน์ post_type สำหรับแยกประเภท แจกแนวทาง(share) / ขอลอก(request)
ALTER TABLE homework_solutions ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'share';

-- 2. เพิ่มคอลัมน์ image_urls สำหรับรองรับการอัปโหลดหลายรูป
ALTER TABLE homework_solutions ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- 3. ย้ายข้อมูลจาก image_url เดิมมาใส่ใน image_urls
UPDATE homework_solutions
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- 4. สั่งให้ Supabase (PostgREST) รีโหลดแคชของตารางใหม่ (แก้ปัญหา Schema Cache)
NOTIFY pgrst, 'reload schema';

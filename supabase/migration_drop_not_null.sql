-- 1. ลบเงื่อนไข NOT NULL ออกจากคอลัมน์ image_url เดิม
ALTER TABLE homework_solutions ALTER COLUMN image_url DROP NOT NULL;

-- 2. สั่งรีโหลด Schema Cache อีกครั้ง
NOTIFY pgrst, 'reload schema';

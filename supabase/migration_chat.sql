-- เพิ่มคอลัมน์ image_urls สำหรับรองรับการส่งรูปภาพในช่องแชท/คอมเมนต์
ALTER TABLE homework_solution_comments ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- รีโหลด Schema Cache
NOTIFY pgrst, 'reload schema';

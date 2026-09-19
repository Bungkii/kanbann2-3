-- ============================================================
-- MIGRATION: EXAM SUMMARIES V2 (Full Student Auth & Multi-File Support)
-- ============================================================

-- 1. Create table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.exam_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    uploader_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drop legacy foreign key constraints on uploader_id (to allow 5-digit student IDs like '30233')
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_summaries' AND column_name = 'uploader_id'
  ) THEN
    ALTER TABLE public.exam_summaries DROP CONSTRAINT IF EXISTS exam_summaries_uploader_id_fkey;
    ALTER TABLE public.exam_summaries ALTER COLUMN uploader_id TYPE text USING uploader_id::text;
  END IF;
END $$;

-- 3. Add all necessary columns if missing
ALTER TABLE public.exam_summaries
  ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS uploader_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS term TEXT DEFAULT '1/69';

-- 4. Enable Row Level Security & set clean policies
ALTER TABLE public.exam_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on exam_summaries" ON public.exam_summaries;
DROP POLICY IF EXISTS "Allow authenticated users to insert exam_summaries" ON public.exam_summaries;
DROP POLICY IF EXISTS "Allow users to update own exam_summaries or admin" ON public.exam_summaries;
DROP POLICY IF EXISTS "Allow users to delete own exam_summaries or admin" ON public.exam_summaries;
DROP POLICY IF EXISTS "Allow all access on exam_summaries" ON public.exam_summaries;

-- Public read access
CREATE POLICY "Allow public read access on exam_summaries"
  ON public.exam_summaries
  FOR SELECT
  USING (true);

-- Full access for service role / authenticated
CREATE POLICY "Allow all access on exam_summaries"
  ON public.exam_summaries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

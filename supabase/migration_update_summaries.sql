-- Add new columns to exam_summaries table
ALTER TABLE public.exam_summaries 
  ADD COLUMN IF NOT EXISTS uploader_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Migration: Add Expense Tracking
-- Run this in Supabase SQL Editor

-- 1. Create class_expenses table
CREATE TABLE IF NOT EXISTS class_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amount numeric NOT NULL,
  description text NOT NULL,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 2. Setup RLS for class_expenses
ALTER TABLE class_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to insert class_expenses" ON class_expenses;
CREATE POLICY "Allow authenticated users to insert class_expenses" ON class_expenses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on class_expenses" ON class_expenses;
CREATE POLICY "Allow public read access on class_expenses" ON class_expenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete access on class_expenses" ON class_expenses;
CREATE POLICY "Allow authenticated delete access on class_expenses" ON class_expenses FOR DELETE TO authenticated USING (true);

-- 3. Create Storage Bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', true) 
ON CONFLICT (id) DO NOTHING;

-- 4. Setup RLS for storage bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'expense-receipts');

DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'expense-receipts');

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'expense-receipts');

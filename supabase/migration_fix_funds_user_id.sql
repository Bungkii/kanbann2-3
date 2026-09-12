-- Migration: Allow text or student ID strings in class_funds.updated_by and class_expenses.created_by
DO $$ 
BEGIN
  -- Alter class_funds.updated_by to text if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_funds' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE class_funds DROP CONSTRAINT IF EXISTS class_funds_updated_by_fkey;
    ALTER TABLE class_funds ALTER COLUMN updated_by TYPE text USING updated_by::text;
  END IF;

  -- Alter class_expenses.created_by to text if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_expenses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE class_expenses DROP CONSTRAINT IF EXISTS class_expenses_created_by_fkey;
    ALTER TABLE class_expenses ALTER COLUMN created_by TYPE text USING created_by::text;
  END IF;
END $$;

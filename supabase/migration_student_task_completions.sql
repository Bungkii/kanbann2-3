-- ==============================================================================
-- MIGRATION: student_task_completions table
-- Description: Tracks per-student homework completion status ('todo', 'in_progress', 'done')
--              so that when a child marks a task as done, it reflects in real-time
--              on the parent portal.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_task_completions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id text NOT NULL,
    task_id text NOT NULL,
    status text NOT NULL DEFAULT 'done' CHECK (status IN ('todo', 'in_progress', 'done')),
    completed_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT uq_student_task UNIQUE (student_id, task_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_task_completions_student ON public.student_task_completions (student_id);
CREATE INDEX IF NOT EXISTS idx_student_task_completions_task ON public.student_task_completions (task_id);
CREATE INDEX IF NOT EXISTS idx_student_task_completions_status ON public.student_task_completions (status);

-- Enable Row Level Security
ALTER TABLE public.student_task_completions ENABLE ROW LEVEL SECURITY;

-- Allow public read access so parent portal can read completion status
DROP POLICY IF EXISTS "Allow public read access on student_task_completions" ON public.student_task_completions;
CREATE POLICY "Allow public read access on student_task_completions" ON public.student_task_completions
    FOR SELECT USING (true);

-- Allow authenticated / service manage access
DROP POLICY IF EXISTS "Allow authenticated manage student_task_completions" ON public.student_task_completions;
CREATE POLICY "Allow authenticated manage student_task_completions" ON public.student_task_completions
    FOR ALL USING (true) WITH CHECK (true);

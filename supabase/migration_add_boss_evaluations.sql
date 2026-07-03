-- Create boss_evaluations table
CREATE TABLE IF NOT EXISTS public.boss_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    appearance_score INTEGER,
    responsibility_score INTEGER,
    traits TEXT[],
    management_score INTEGER,
    communication_score INTEGER,
    problem_solving_score INTEGER,
    suggestion TEXT,
    overall_score INTEGER,
    improvements TEXT[],
    should_change_boss BOOLEAN
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.boss_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since it's a public evaluation form)
CREATE POLICY "Allow anonymous inserts to boss_evaluations" ON public.boss_evaluations
    FOR INSERT WITH CHECK (true);

-- Only allow authenticated users (like admin) to read
CREATE POLICY "Allow authenticated reads on boss_evaluations" ON public.boss_evaluations
    FOR SELECT TO authenticated USING (true);

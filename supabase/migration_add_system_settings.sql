CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on system_settings" ON public.system_settings;
CREATE POLICY "Allow public read access on system_settings" ON public.system_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow any logged-in user to manage system_settings" ON public.system_settings;
CREATE POLICY "Allow any logged-in user to manage system_settings" ON public.system_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.system_settings (key, value)
VALUES ('boss_evaluation_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

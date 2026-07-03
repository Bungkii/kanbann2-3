CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on system_settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage system_settings" ON public.system_settings
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    );

INSERT INTO public.system_settings (key, value)
VALUES ('boss_evaluation_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

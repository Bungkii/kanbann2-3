-- Create table for homework tasks
CREATE TABLE IF NOT EXISTS homework_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    details text NOT NULL,
    image_url text,
    teacher_name text,
    status text DEFAULT 'todo'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE homework_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for access
-- Allow ANYONE (including public) to read tasks
CREATE POLICY "Allow public read access" ON homework_tasks FOR SELECT USING (true);
-- Allow only authenticated users to insert, update, and delete
CREATE POLICY "Allow authenticated insert access" ON homework_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON homework_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON homework_tasks FOR DELETE TO authenticated USING (true);

-- Create storage bucket for homework images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homework-images', 'homework-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for homework-images
-- Allow public access to read images
CREATE POLICY "Public access to read images" ON storage.objects FOR SELECT USING (bucket_id = 'homework-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'homework-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'homework-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'homework-images');

-- Create table for leader votes
CREATE TABLE IF NOT EXISTS leader_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable Row Level Security for leader_votes
ALTER TABLE leader_votes ENABLE ROW LEVEL SECURITY;

-- Allow public access to leader_votes for webhook operations
CREATE POLICY "Allow public all access on leader_votes" ON leader_votes FOR ALL USING (true) WITH CHECK (true);

-- Create table for system settings (e.g., poll end times)
CREATE TABLE IF NOT EXISTS system_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- Create table for custom polls
CREATE TABLE IF NOT EXISTS custom_polls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question text NOT NULL,
    options text[] NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for custom_polls
ALTER TABLE custom_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on custom_polls" ON custom_polls FOR ALL USING (true) WITH CHECK (true);

-- Create table for custom poll votes
CREATE TABLE IF NOT EXISTS custom_poll_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id uuid REFERENCES custom_polls(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    voted_for text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security for custom_poll_votes
ALTER TABLE custom_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on custom_poll_votes" ON custom_poll_votes FOR ALL USING (true) WITH CHECK (true);

-- Allow public access to system_settings for webhook operations and client-side access
CREATE POLICY "Allow public all access on system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ai_homework_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text,
  line_source_type text NOT NULL DEFAULT 'user',
  line_source_id text,
  tasks jsonb NOT NULL,
  model_used text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'saved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS ai_homework_drafts_expires_at_idx ON ai_homework_drafts (expires_at);
ALTER TABLE ai_homework_drafts ENABLE ROW LEVEL SECURITY;

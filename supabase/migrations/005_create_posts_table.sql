-- Create posts table for individual posts linked to generations
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
  content TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_generation_id ON posts(generation_id);
CREATE INDEX idx_posts_platform ON posts(platform);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts of their generations" ON posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generations g WHERE g.id = posts.generation_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert posts for their generations" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM generations g WHERE g.id = posts.generation_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts of their generations" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM generations g WHERE g.id = posts.generation_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts of their generations" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM generations g WHERE g.id = posts.generation_id AND g.user_id = auth.uid()
    )
  );

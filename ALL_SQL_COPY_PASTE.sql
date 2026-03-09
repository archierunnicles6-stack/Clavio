-- =============================================================================
-- CLAVIO / VOICEIDEA - COMPLETE SQL SCHEMA (COPY & PASTE)
-- =============================================================================
-- Database: PostgreSQL (Supabase)
-- Run this in order. For Supabase: Dashboard > SQL Editor > paste and run.
--
-- IMPORTANT: For Supabase, users.id must reference auth.users(id).
-- If migrating from an older schema, add: ALTER TABLE users ADD CONSTRAINT
--   users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- -----------------------------------------------------------------------------
-- SECTION 2: USERS TABLE (Migration 001 + 004 profile columns)
-- -----------------------------------------------------------------------------
-- NOTE: id must reference auth.users(id) for Supabase Google OAuth to work.
-- Users are created in auth.users on sign-in, then upserted here with same id.
-- If table already exists without FK, run: ALTER TABLE users ADD CONSTRAINT users_id_fkey
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'incomplete' CHECK (subscription_status IN ('active', 'trialing', 'canceled', 'incomplete')),
  audience_preference TEXT,
  tone_preference TEXT,
  goal_preference TEXT,
  -- Profile columns (OAuth metadata)
  full_name TEXT,
  avatar_url TEXT,
  platform_preference TEXT DEFAULT 'both',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- SECTION 3: GENERATIONS TABLE (Migration 002 + 004 metadata columns)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  posts JSONB NOT NULL,
  audience TEXT,
  goal TEXT,
  tone TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);


-- -----------------------------------------------------------------------------
-- SECTION 4: ROW LEVEL SECURITY - USERS (Migration 003)
-- -----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- SECTION 5: ROW LEVEL SECURITY - GENERATIONS
-- -----------------------------------------------------------------------------
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- SECTION 6: POSTS TABLE (Migration 005)
-- -----------------------------------------------------------------------------
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


-- =============================================================================
-- SECTION 7: ADDITIONAL TABLES (from schema.sql - full schema)
-- Use these if you want the complete VoiceIdea schema with analytics, etc.
-- =============================================================================

-- Post analytics table (optional - for tracking performance)
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_rank INTEGER NOT NULL,
    post_content TEXT NOT NULL,
    post_score INTEGER NOT NULL CHECK (post_score >= 0 AND post_score <= 100),
    views INTEGER DEFAULT 0,
    copies INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    linkedin_likes INTEGER DEFAULT 0,
    linkedin_comments INTEGER DEFAULT 0,
    linkedin_shares INTEGER DEFAULT 0,
    linkedin_views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(generation_id, post_rank)
);

CREATE INDEX IF NOT EXISTS idx_post_analytics_generation_id ON post_analytics(generation_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_user_id ON post_analytics(user_id);

-- Usage logs table (optional - for billing and analytics)
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('generation', 'post_view', 'post_copy', 'post_download', 'audio_upload')),
    resource_id UUID,
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Enable RLS on optional tables
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON post_analytics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own analytics" ON post_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON post_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create usage logs" ON usage_logs
    FOR INSERT WITH CHECK (true);

-- Triggers for optional tables
CREATE TRIGGER handle_post_analytics_updated_at
    BEFORE UPDATE ON post_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- SECTION 8: GRANTS (Supabase authenticated role)
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- For post_analytics and usage_logs (if created above):
GRANT SELECT, INSERT, UPDATE, DELETE ON post_analytics TO authenticated;
GRANT SELECT, INSERT ON usage_logs TO authenticated;


-- =============================================================================
-- SECTION 9: TOKEN SYSTEM (run sql/token-system-migration.sql for full setup)
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tokens_remaining INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_limit INTEGER DEFAULT 2040,
  ADD COLUMN IF NOT EXISTS tokens_reset_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION deduct_user_tokens(p_user_id UUID, p_amount INT)
RETURNS TABLE(ok BOOLEAN, remaining INT) AS $$
DECLARE cur INT; new_remaining INT;
BEGIN
  IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, 0; RETURN; END IF;
  SELECT COALESCE(tokens_remaining, 0) INTO cur FROM users WHERE id = p_user_id FOR UPDATE;
  IF cur IS NULL THEN RETURN QUERY SELECT FALSE, 0; RETURN; END IF;
  IF cur < p_amount THEN RETURN QUERY SELECT FALSE, cur; RETURN; END IF;
  new_remaining := cur - p_amount;
  UPDATE users SET tokens_remaining = new_remaining WHERE id = p_user_id;
  RETURN QUERY SELECT TRUE, new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION deduct_user_tokens(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_tokens(UUID, INT) TO service_role;


-- =============================================================================
-- END OF SQL SCHEMA
-- =============================================================================

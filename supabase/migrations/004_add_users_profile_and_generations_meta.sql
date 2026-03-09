-- Add profile columns to users (for OAuth metadata)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_preference TEXT DEFAULT 'both';

-- Add metadata columns to generations (for API compatibility)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS audience TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

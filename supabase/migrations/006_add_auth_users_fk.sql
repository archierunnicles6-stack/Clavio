-- Add auth.users FK to users table (for Google OAuth compatibility)
-- Requires all existing user ids to exist in auth.users (they do, from sign-in)
ALTER TABLE users ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

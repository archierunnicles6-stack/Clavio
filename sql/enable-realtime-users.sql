-- =============================================================================
-- ENABLE REALTIME FOR USERS TABLE (optional)
-- =============================================================================
-- Run in Supabase SQL Editor if TokenDisplay doesn't update live.
-- Required for real-time token updates in the sidebar.
-- =============================================================================

-- Add users table to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END
$$;

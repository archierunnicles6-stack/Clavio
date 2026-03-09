-- =============================================================================
-- TOKEN SYSTEM - Run in Supabase SQL Editor
-- =============================================================================
-- 1. Adds token columns to users (if not exist)
-- 2. Creates deduct function for atomic updates
-- 3. Enables Realtime so UI updates live
-- =============================================================================

-- Step 1: Add columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tokens_remaining INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_limit INTEGER DEFAULT 2040,
  ADD COLUMN IF NOT EXISTS tokens_reset_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Atomic deduct function (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_user_tokens(p_user_id UUID, p_amount INT)
RETURNS TABLE(ok BOOLEAN, remaining INT) AS $$
DECLARE
  cur INT;
  new_remaining INT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  SELECT COALESCE(tokens_remaining, 0) INTO cur FROM users WHERE id = p_user_id FOR UPDATE;
  IF cur IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  IF cur < p_amount THEN
    RETURN QUERY SELECT FALSE, cur;
    RETURN;
  END IF;
  new_remaining := cur - p_amount;
  UPDATE users SET tokens_remaining = new_remaining WHERE id = p_user_id;
  RETURN QUERY SELECT TRUE, new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION deduct_user_tokens(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_tokens(UUID, INT) TO service_role;

-- Step 3: Realtime (so UI updates when tokens change)
-- Run separately if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- =============================================================================
-- GIVE FULL TOKENS TO ACTIVE USERS - Run in Supabase SQL Editor
-- =============================================================================
-- Use after testing 0 state. Gives active/trialing users full tokens.
-- =============================================================================

UPDATE users
SET tokens_remaining = COALESCE(NULLIF(tokens_limit, 0), 2040),
    tokens_limit = COALESCE(NULLIF(tokens_limit, 0), 2040),
    tokens_reset_at = COALESCE(tokens_reset_at, NOW() + INTERVAL '1 month')
WHERE subscription_status IN ('active', 'trialing');

-- =============================================================================
-- RESET TOKENS FOR TESTING - Run in Supabase SQL Editor
-- =============================================================================
-- Updates ALL users. No WHERE clause - guarantees rows are updated.
-- Option A: Set to 0 (test blocked state)
-- Option B: Set to full 2040 (test deduct flow)
-- =============================================================================

-- Option A: Set everyone to 0 tokens (test "insufficient tokens" state)
UPDATE users
SET tokens_remaining = 0,
    tokens_limit = 2040,
    tokens_reset_at = NOW() + INTERVAL '1 month';

-- Option B: Set everyone to full tokens (test deduct - run generation/chat)
-- UPDATE users
-- SET tokens_remaining = 2040,
--     tokens_limit = 2040,
--     tokens_reset_at = NOW() + INTERVAL '1 month';

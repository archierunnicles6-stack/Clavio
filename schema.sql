-- VoiceIdea Database Schema
-- PostgreSQL schema for LinkedIn post generation SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription and billing
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'inactive')),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Content preferences
    audience_preference TEXT CHECK (audience_preference IN ('founders', 'consultants', 'b2b_creators', 'executives', 'sales_professionals', 'marketers', 'developers', 'general')),
    goal_preference TEXT CHECK (goal_preference IN ('thought_leadership', 'lead_generation', 'brand_awareness', 'engagement', 'authority_building', 'community_building', 'storytelling')),
    tone_preference TEXT CHECK (tone_preference IN ('vulnerable', 'confident', 'contrarian', 'educational', 'inspirational', 'conversational', 'analytical')),
    
    -- Usage tracking
    total_generations INTEGER DEFAULT 0,
    total_posts_generated INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generations table for storing post generation sessions
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Input data
    transcript TEXT NOT NULL,
    audience TEXT NOT NULL CHECK (audience IN ('founders', 'consultants', 'b2b_creators', 'executives', 'sales_professionals', 'marketers', 'developers', 'general')),
    goal TEXT NOT NULL CHECK (goal IN ('thought_leadership', 'lead_generation', 'brand_awareness', 'engagement', 'authority_building', 'community_building', 'storytelling')),
    tone TEXT NOT NULL CHECK (tone IN ('vulnerable', 'confident', 'contrarian', 'educational', 'inspirational', 'conversational', 'analytical')),
    
    -- Generated content (JSON array of posts with rankings and scores)
    posts JSONB NOT NULL DEFAULT '[]',
    
    -- Processing info
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_time_seconds INTEGER,
    error_message TEXT,
    
    -- Audio file info (if applicable)
    audio_file_url TEXT,
    audio_file_size INTEGER,
    audio_duration_seconds INTEGER,
    
    -- Usage metrics
    tokens_used INTEGER,
    cost_cents INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post analytics table for tracking performance
CREATE TABLE IF NOT EXISTS public.post_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Post identification
    post_rank INTEGER NOT NULL,
    post_content TEXT NOT NULL,
    post_score INTEGER NOT NULL CHECK (post_score >= 0 AND post_score <= 100),
    
    -- User interactions
    views INTEGER DEFAULT 0,
    copies INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- External metrics (if user provides)
    linkedin_likes INTEGER DEFAULT 0,
    linkedin_comments INTEGER DEFAULT 0,
    linkedin_shares INTEGER DEFAULT 0,
    linkedin_views INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique post per generation
    UNIQUE(generation_id, post_rank)
);

-- Usage logs table for billing and analytics
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Usage details
    action TEXT NOT NULL CHECK (action IN ('generation', 'post_view', 'post_copy', 'post_download', 'audio_upload')),
    resource_id UUID, -- Can reference generation_id or other resources
    
    -- Metrics
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Session info
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Key details
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
    key_prefix TEXT NOT NULL, -- First few characters for identification
    
    -- Permissions and limits
    permissions JSONB DEFAULT '{"generations": true, "analytics": false}',
    rate_limit_per_hour INTEGER DEFAULT 100,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Feedback table for user feedback on generated content
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
    
    -- Feedback details
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rating', 'issue', 'suggestion', 'bug')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    
    -- Context
    post_rank INTEGER,
    metadata JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_audience ON public.generations(audience);
CREATE INDEX IF NOT EXISTS idx_generations_goal ON public.generations(goal);
CREATE INDEX IF NOT EXISTS idx_generations_tone ON public.generations(tone);

CREATE INDEX IF NOT EXISTS idx_post_analytics_generation_id ON public.post_analytics(generation_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_user_id ON public.post_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_score ON public.post_analytics(post_score DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_generation_id ON public.feedback(generation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Generations table policies
CREATE POLICY "Users can view own generations" ON public.generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON public.generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON public.generations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.generations
    FOR DELETE USING (auth.uid() = user_id);

-- Post analytics table policies
CREATE POLICY "Users can view own analytics" ON public.post_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON public.post_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.post_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage logs table policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (true);

-- User sessions table policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.user_sessions
    FOR ALL USING (true);

-- API keys table policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Feedback table policies
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_generations_updated_at
    BEFORE UPDATE ON public.generations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_post_analytics_updated_at
    BEFORE UPDATE ON public.post_analytics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_sessions_last_accessed_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update user generation counts
CREATE OR REPLACE FUNCTION public.update_user_generation_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.users 
        SET 
            total_generations = total_generations + 1,
            total_posts_generated = total_posts_generated + jsonb_array_length(NEW.posts)
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.users 
        SET 
            total_generations = total_generations - 1,
            total_posts_generated = total_posts_generated - jsonb_array_length(OLD.posts)
        WHERE id = OLD.user_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.users 
        SET total_posts_generated = total_posts_generated - jsonb_array_length(OLD.posts) + jsonb_array_length(NEW.posts)
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_generation_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.generations
    FOR EACH ROW EXECUTE FUNCTION public.update_user_generation_counts();

-- Function to log usage
CREATE OR REPLACE FUNCTION public.log_usage(
    p_user_id UUID,
    p_action TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT 0,
    p_cost_cents INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.usage_logs (
        user_id, action, resource_id, tokens_used, cost_cents, metadata
    ) VALUES (
        p_user_id, p_action, p_resource_id, p_tokens_used, p_cost_cents, p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE OR REPLACE VIEW public.user_generation_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(g.id) as total_generations,
    SUM(jsonb_array_length(g.posts)) as total_posts,
    AVG(jsonb_array_length(g.posts)) as avg_posts_per_generation,
    MAX(g.created_at) as last_generation_date,
    SUM(g.tokens_used) as total_tokens_used,
    SUM(g.cost_cents) as total_cost_cents
FROM public.users u
LEFT JOIN public.generations g ON u.id = g.user_id
GROUP BY u.id, u.email;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_analytics TO authenticated;
GRANT SELECT ON public.usage_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feedback TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on views
GRANT SELECT ON public.user_generation_stats TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_generation_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_usage TO authenticated;

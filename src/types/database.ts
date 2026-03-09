export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          stripe_customer_id: string | null
          subscription_status: 'active' | 'trialing' | 'canceled' | 'incomplete'
          audience_preference: string | null
          tone_preference: string | null
          goal_preference: string | null
          full_name: string | null
          avatar_url: string | null
          platform_preference: string
          created_at: string
          updated_at: string
          tokens_remaining: number | null
          tokens_limit: number | null
          tokens_reset_at: string | null
        }
        Insert: {
          id: string
          email: string
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'trialing' | 'canceled' | 'incomplete'
          audience_preference?: string | null
          tone_preference?: string | null
          goal_preference?: string | null
          full_name?: string | null
          avatar_url?: string | null
          platform_preference?: string
          created_at?: string
          updated_at?: string
          tokens_remaining?: number | null
          tokens_limit?: number | null
          tokens_reset_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'trialing' | 'canceled' | 'incomplete'
          audience_preference?: string | null
          tone_preference?: string | null
          goal_preference?: string | null
          full_name?: string | null
          avatar_url?: string | null
          platform_preference?: string
          created_at?: string
          updated_at?: string
          tokens_remaining?: number | null
          tokens_limit?: number | null
          tokens_reset_at?: string | null
        }
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          user_id: string
          transcript: string
          posts: Json
          audience: string | null
          goal: string | null
          tone: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transcript: string
          posts: Json
          audience?: string | null
          goal?: string | null
          tone?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transcript?: string
          posts?: Json
          audience?: string | null
          goal?: string | null
          tone?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          generation_id: string
          platform: string
          content: string
          score: number
          rank: number
          created_at: string
        }
        Insert: {
          id?: string
          generation_id: string
          platform: string
          content: string
          score?: number
          rank: number
          created_at?: string
        }
        Update: {
          id?: string
          generation_id?: string
          platform?: string
          content?: string
          score?: number
          rank?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      deduct_user_tokens: {
        Args: { p_user_id: string; p_amount: number }
        Returns: { ok: boolean; remaining: number }[]
      }
    }
    Enums: Record<string, never>
  }
}

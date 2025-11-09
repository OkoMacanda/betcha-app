// Generated TypeScript types for Supabase database schema

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
      profiles: {
        Row: {
          user_id: string
          email: string
          balance: number
          kyc_status: 'not_started' | 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          balance?: number
          kyc_status?: 'not_started' | 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          balance?: number
          kyc_status?: 'not_started' | 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          creator_id: string
          opponent_id: string
          game_name: string
          bet_amount: number
          game_rules: string | null
          duration: string | null
          status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'
          winner_id: string | null
          game_rule_id: string | null
          win_condition: Json | null
          evidence_required: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          opponent_id: string
          game_name: string
          bet_amount: number
          game_rules?: string | null
          duration?: string | null
          status?: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'
          winner_id?: string | null
          game_rule_id?: string | null
          win_condition?: Json | null
          evidence_required?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          opponent_id?: string
          game_name?: string
          bet_amount?: number
          game_rules?: string | null
          duration?: string | null
          status?: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'
          winner_id?: string | null
          game_rule_id?: string | null
          win_condition?: Json | null
          evidence_required?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      escrow: {
        Row: {
          id: string
          bet_id: string
          creator_amount: number
          opponent_amount: number | null
          status: 'pending' | 'locked' | 'released' | 'refunded'
          created_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          bet_id: string
          creator_amount: number
          opponent_amount?: number | null
          status?: 'pending' | 'locked' | 'released' | 'refunded'
          created_at?: string
          released_at?: string | null
        }
        Update: {
          id?: string
          bet_id?: string
          creator_amount?: number
          opponent_amount?: number | null
          status?: 'pending' | 'locked' | 'released' | 'refunded'
          created_at?: string
          released_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'deposit' | 'withdrawal' | 'bet_locked' | 'bet_won' | 'bet_lost' | 'platform_fee' | 'refund'
          status: 'pending' | 'completed' | 'failed'
          bet_id: string | null
          stripe_payment_intent_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'deposit' | 'withdrawal' | 'bet_locked' | 'bet_won' | 'bet_lost' | 'platform_fee' | 'refund'
          status?: 'pending' | 'completed' | 'failed'
          bet_id?: string | null
          stripe_payment_intent_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'deposit' | 'withdrawal' | 'bet_locked' | 'bet_won' | 'bet_lost' | 'platform_fee' | 'refund'
          status?: 'pending' | 'completed' | 'failed'
          bet_id?: string | null
          stripe_payment_intent_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      evidence: {
        Row: {
          id: string
          bet_id: string
          user_id: string
          evidence_type: 'photo' | 'video' | 'screenshot' | 'document'
          evidence_url: string
          description: string | null
          status: 'submitted' | 'verified' | 'rejected'
          submitted_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          user_id: string
          evidence_type: 'photo' | 'video' | 'screenshot' | 'document'
          evidence_url: string
          description?: string | null
          status?: 'submitted' | 'verified' | 'rejected'
          submitted_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          user_id?: string
          evidence_type?: 'photo' | 'video' | 'screenshot' | 'document'
          evidence_url?: string
          description?: string | null
          status?: 'submitted' | 'verified' | 'rejected'
          submitted_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          bet_id: string
          raised_by_user_id: string
          reason: string
          status: 'open' | 'under_review' | 'resolved'
          resolution: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          raised_by_user_id: string
          reason: string
          status?: 'open' | 'under_review' | 'resolved'
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          raised_by_user_id?: string
          reason?: string
          status?: 'open' | 'under_review' | 'resolved'
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      kyc_verifications: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'under_review' | 'verified' | 'rejected'
          id_front_url: string
          id_back_url: string
          selfie_url: string
          rejection_reason: string | null
          submitted_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'under_review' | 'verified' | 'rejected'
          id_front_url: string
          id_back_url: string
          selfie_url: string
          rejection_reason?: string | null
          submitted_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'under_review' | 'verified' | 'rejected'
          id_front_url?: string
          id_back_url?: string
          selfie_url?: string
          rejection_reason?: string | null
          submitted_at?: string
          reviewed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_bet_id?: string | null
        }
        Returns: void
      }
      calculate_payout: {
        Args: {
          p_bet_amount: number
        }
        Returns: number
      }
      complete_bet: {
        Args: {
          p_bet_id: string
          p_winner_id: string
        }
        Returns: void
      }
      refund_bet: {
        Args: {
          p_bet_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Bet = Database['public']['Tables']['bets']['Row']
export type BetInsert = Database['public']['Tables']['bets']['Insert']
export type BetUpdate = Database['public']['Tables']['bets']['Update']

export type Escrow = Database['public']['Tables']['escrow']['Row']
export type EscrowInsert = Database['public']['Tables']['escrow']['Insert']
export type EscrowUpdate = Database['public']['Tables']['escrow']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Evidence = Database['public']['Tables']['evidence']['Row']
export type EvidenceInsert = Database['public']['Tables']['evidence']['Insert']
export type EvidenceUpdate = Database['public']['Tables']['evidence']['Update']

export type Dispute = Database['public']['Tables']['disputes']['Row']
export type DisputeInsert = Database['public']['Tables']['disputes']['Insert']
export type DisputeUpdate = Database['public']['Tables']['disputes']['Update']

export type KYCVerification = Database['public']['Tables']['kyc_verifications']['Row']
export type KYCVerificationInsert = Database['public']['Tables']['kyc_verifications']['Insert']
export type KYCVerificationUpdate = Database['public']['Tables']['kyc_verifications']['Update']

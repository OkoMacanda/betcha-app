// ================================================
// SOCIAL & GROUP BETTING TYPE DEFINITIONS
// ================================================

export type ChallengeType = 'one_on_one' | 'group_individual' | 'team_vs_team' | 'tournament';

export type InviteMethod = 'email' | 'sms' | 'in_app';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type ContactSource = 'phone' | 'email' | 'challenged' | 'manual';

export type GroupMemberRole = 'owner' | 'admin' | 'member';

// ================================================
// CONTACT INTERFACES
// ================================================

export interface Contact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_avatar_url?: string;
  linked_user_id?: string;
  source: ContactSource;
  total_challenges: number;
  wins_against: number;
  losses_against: number;
  created_at: string;
  updated_at: string;
}

export interface ImportContactData {
  name: string;
  email?: string;
  phone?: string;
}

// ================================================
// GROUP INTERFACES
// ================================================

export interface FriendGroup {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_count: number;
  total_challenges: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  memberIds?: string[];
}

// ================================================
// INVITE INTERFACES
// ================================================

export interface ChallengeInvite {
  id: string;
  bet_id?: string;
  inviter_id: string;
  invitee_email?: string;
  invitee_phone?: string;
  invitee_user_id?: string;
  invite_method: InviteMethod;
  invite_token: string;
  status: InviteStatus;
  sent_at: string;
  expires_at: string;
  responded_at?: string;
  created_at: string;
}

export interface SendInviteData {
  betId: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  inviteeUserId?: string;
  inviteMethod: InviteMethod;
}

// ================================================
// CHALLENGE PARTICIPANT INTERFACES
// ================================================

export interface ChallengeParticipant {
  id: string;
  bet_id: string;
  user_id: string;
  team_name?: string;
  entry_paid: boolean;
  escrow_amount: number;
  final_rank?: number;
  payout_amount: number;
  joined_at: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ChallengeTeam {
  id: string;
  bet_id: string;
  team_name: string;
  team_captain_id: string;
  member_count: number;
  total_stake: number;
  final_rank?: number;
  created_at: string;
  members?: ChallengeParticipant[];
}

// ================================================
// CHALLENGE HISTORY INTERFACES
// ================================================

export interface ChallengeHistoryItem {
  bet_id: string;
  opponent_name: string;
  opponent_id: string;
  game_name: string;
  bet_amount: number;
  challenge_type: ChallengeType;
  result: 'won' | 'lost' | 'active' | 'cancelled' | 'draw';
  winnings?: number;
  completed_at?: string;
  created_at: string;
}

export interface HeadToHeadStats {
  opponent_id: string;
  opponent_name: string;
  opponent_avatar?: string;
  total_challenges: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  total_won: number;
  total_lost: number;
  net_profit: number;
  last_challenge_date: string;
}

// ================================================
// PRIZE DISTRIBUTION INTERFACES
// ================================================

export interface PrizeDistribution {
  first: number;  // percentage
  second?: number;
  third?: number;
}

export interface GroupChallengeData {
  challenge_type: ChallengeType;
  entry_fee: number;
  min_participants?: number;
  max_participants?: number;
  prize_distribution: PrizeDistribution;
  game_name: string;
  game_rules?: string;
  duration?: string;
}

export interface TeamChallengeData {
  challenge_type: 'team_vs_team' | 'tournament';
  entry_fee: number;
  teams: {
    name: string;
    captain_id: string;
    member_ids: string[];
  }[];
  game_name: string;
  game_rules?: string;
  duration?: string;
}

export interface ChallengeResults {
  bet_id: string;
  rankings?: {
    user_id: string;
    rank: number;
  }[];
  team_rankings?: {
    team_name: string;
    rank: number;
  }[];
  winning_team_name?: string;
}

// ================================================
// PLATFORM WALLET INTERFACE
// ================================================

export interface PlatformWallet {
  id: string;
  balance: number;
  total_fees_collected: number;
  total_payouts: number;
  updated_at: string;
}

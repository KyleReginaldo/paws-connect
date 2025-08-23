export interface Fundraising {
  id: number;
  title: string | null;
  description: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FundraisingWithUser extends Fundraising {
  created_by_user?: {
    username: string;
    email: string;
  };
}

export interface FundraisingStats {
  total_campaigns: number;
  pending_campaigns: number;
  ongoing_campaigns: number;
  completed_campaigns: number;
  rejected_campaigns: number;
  cancelled_campaigns: number;
  total_raised: number;
  total_target: number;
}

export type FundraisingStatus = 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED';

export interface Fundraising {
  id: number;
  title: string | null;
  description: string | null;
  purpose?: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  images?: string[] | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  end_date: string | null;
  facebook_link: string | null;
  qr_code: string | null;
  bank_accounts?: Array<{
    label: string;
    account_number: string;
    qr_code?: string | null;
  }> | null;
  e_wallets?: Array<{
    label: string;
    account_number: string;
    qr_code?: string | null;
  }> | null;
  links?: string[] | null;
}

export interface FundraisingWithUser extends Fundraising {
  created_by_user?: {
    username: string;
    email: string;
  };
}

export interface FundraisingWithDonations extends Fundraising {
  created_by_user?: {
    username: string;
    email: string;
  };
  donations?: {
    id: number;
    amount: number;
    message: string | null;
    donated_at: string;
    reference_number: string | null;
    screenshot: string | null;
    is_anonymous: boolean;
    donor: {
      id: string;
      username: string | null;
      email: string | null;
    } | null;
  }[];
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

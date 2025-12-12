export interface Fundraising {
  id: number;
  created_at: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  created_by: string;
  status: string ;
  images: string[];
  end_date: string;
  facebook_link: string | null;
  qr_code: string | null;
  gcash_number: string | null;
  bank_accounts: BankAccount[] | null;
  e_wallets: EWallet[];
  links: string[] | null;
  purpose: string;
  created_by_user: CreatedByUser;
  donations_count: DonationCount[];
  all_donations: Donation[];
}

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface EWallet {
  label: string;
  qr_code: string;
  account_number: string;
}

export interface CreatedByUser {
  email: string;
  username: string;
}

export interface DonationCount {
  count: number;
}

export interface Donation {
  id: number;
  donor: string;
  amount: number;
  message: string;
  donated_at: string;
  screenshot: string;
  fundraising: number;
  is_anonymous: boolean;
  reference_number: string;
}

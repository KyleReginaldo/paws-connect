import { Tables, TablesInsert, TablesUpdate } from '../../../database.types';

export type Donation = Tables<'donations'>;
export type DonationInsert = TablesInsert<'donations'>;
export type DonationUpdate = TablesUpdate<'donations'>;

export interface DonationWithDetails extends Donation {
  donor_details?: {
    id: string;
    username: string | null;
    email: string | null;
  } | null;
  fundraising_details?: {
    id: number;
    title: string | null;
    description: string | null;
    target_amount: number | null;
    raised_amount: number | null;
  } | null;
}

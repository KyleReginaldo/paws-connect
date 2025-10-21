import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(request.body);
    const LIMIT = 10;

    const query = supabase
      .from('donations')
      .select(
        `
        id,
        amount,
        donated_at,
        is_anonymous,
        donor,
        users:users!donations_donor_fkey (
          id,
          username,
          email,
          profile_image_link
        )
      `,
      )
      .not('donor', 'is', null);
    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch donations for all-time top:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    interface Row {
      id: number;
      amount: number | null;
      donated_at: string;
      is_anonymous: boolean | null;
      donor: string;
      users: { id: string; username: string | null; email: string | null; profile_image_link: string | null } | null;
    }

    const byDonor = new Map<
      string,
      {
        user: { id: string; username: string | null; email: string | null; profile_image_link: string | null };
        total_amount: number;
        donation_count: number;
        last_donated_at: string;
      }
    >();

    (data as Row[] | null)?.forEach((row) => {
      if (!row.donor) return;
      const key = row.donor;
      const amount = row.amount || 0;

      const existing = byDonor.get(key);
      const last_donated_at = existing
        ? new Date(Math.max(new Date(existing.last_donated_at).getTime(), new Date(row.donated_at).getTime())).toISOString()
        : row.donated_at;

      if (!existing) {
        byDonor.set(key, {
          user: {
            id: row.users?.id || key,
            username: row.users?.username ?? null,
            email: row.users?.email ?? null,
            profile_image_link: row.users?.profile_image_link ?? null,
          },
          total_amount: amount,
          donation_count: 1,
          last_donated_at,
        });
      } else {
        existing.total_amount += amount;
        existing.donation_count += 1;
        existing.last_donated_at = last_donated_at;
      }
    });

    const sorted = Array.from(byDonor.values()).sort((a, b) => {
      if (b.total_amount !== a.total_amount) return b.total_amount - a.total_amount;
      if (b.donation_count !== a.donation_count) return b.donation_count - a.donation_count;
      return new Date(b.last_donated_at).getTime() - new Date(a.last_donated_at).getTime();
    });

    const results = sorted.slice(0, LIMIT).map((d, index) => ({
      rank: index + 1,
      user: d.user,
      totals: {
        amount: d.total_amount,
        count: d.donation_count,
        last_donated_at: d.last_donated_at,
      },
    }));

    return new Response(
      JSON.stringify({
        message: 'Success',
        data: results,
        meta: {
          range: 'all',
          limit: LIMIT,
          sort: 'amount',
          fundraising: null,
          generated_at: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('All-time top donors error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Validate limit parameter
    const limitParam = searchParams.get('limit') || '10';
    const limit = parseInt(limitParam, 10);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Limit must be a number between 1 and 100' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's donations
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select(
        `
        id,
        amount,
        message,
        donated_at,
        fundraising:fundraising(
          id,
          title,
          description,
          target_amount,
          raised_amount,
          status,
          created_by_user:users!created_by(id, username, email)
        )
      `,
      )
      .eq('donor', userId)
      .order('donated_at', { ascending: false })
      .limit(limit);

    if (donationsError) {
      console.error('Failed to fetch user donations:', donationsError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch donations', message: donationsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Calculate total donated by user
    const totalDonated = donations?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        message: 'Success',
        data: {
          user: userData,
          donations: donations || [],
          summary: {
            total_donations: donations?.length || 0,
            total_amount: totalDonated,
            limit,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('User donations GET error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

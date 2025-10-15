import { supabase } from '@/app/supabase/supabase';
import { createDonationSchema, getDonationsQuerySchema } from '@/config/schema/donationSchema';
import { DonationInsert } from '@/config/types/donation';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = createDonationSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          issues: result.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { amount, fundraising, donor, message, reference_number, screenshot, is_anonymous } = result.data;

    // Check if fundraising campaign exists and is ongoing
    const { data: fundData, error: fundError } = await supabase
      .from('fundraising')
      .select('id, title, status, raised_amount, target_amount')
      .eq('id', fundraising)
      .single();

    if (fundError || !fundData) {
      return new Response(JSON.stringify({ error: 'Fundraising campaign not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (fundData.status !== 'ONGOING') {
      return new Response(
        JSON.stringify({
          error: 'Cannot donate to this campaign',
          message: `Campaign status is ${fundData.status}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // If donor is provided, verify the user exists
    if (donor) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', donor)
        .single();

      if (userError || !userData) {
        return new Response(JSON.stringify({ error: 'Donor user not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Prepare donation insert data
    const donationData: DonationInsert = {
      amount,
      fundraising,
      donor,
      message,
      donated_at: new Date().toISOString(),
      reference_number,
      screenshot,
      is_anonymous
    };

    // Insert donation record
    const { data: donation, error: insertError } = await supabase
      .from('donations')
      .insert(donationData)
      .select('*, fundraising(id, title)')
      .single();

    if (insertError) {
      console.error('Failed to insert donation:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create donation', message: insertError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Update fundraising raised_amount atomically
    const currentRaised = fundData.raised_amount || 0;
    const newRaised = currentRaised + amount;

    const { data: updatedFund, error: updateError } = await supabase
      .from('fundraising')
      .update({ raised_amount: newRaised })
      .eq('id', fundraising)
      .select('id, title, raised_amount, target_amount')
      .single();

    if (updateError) {
      console.error('Failed to update fundraising raised_amount:', updateError.message);
      // Not fatal: return donation but inform update failed
      return new Response(
        JSON.stringify({
          message: 'Donation created but failed to update fundraising total',
          donation,
          updateError: updateError.message,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Donation created successfully',
        donation,
        fundraising: updatedFund,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Donation POST error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate query parameters
    const queryResult = getDonationsQuerySchema.safeParse({
      limit: searchParams.get('limit') || '10',
      fundraising: searchParams.get('fundraising'),
    });

    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameters',
          issues: queryResult.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { limit, fundraising } = queryResult.data;

    let query = supabase
      .from('donations')
      .select(
        `
        id,
        amount,
        message,
        donated_at,
        donor:users(id, username, email),
        fundraising:fundraising(id, title, description, target_amount, raised_amount)
      `,
      )
      .order('donated_at', { ascending: false })
      .limit(limit);

    // Filter by fundraising campaign if specified
    if (fundraising) {
      query = query.eq('fundraising', fundraising);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch donations:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch donations', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Success',
        data,
        pagination: {
          limit,
          count: data.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Donations GET error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

import { supabase } from '@/app/supabase/supabase';
import { DonationUpdate } from '@/config/types/donation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const donationId = parseInt(id, 10);

    if (isNaN(donationId)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
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
      .eq('id', donationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Donation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Failed to fetch donation:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch donation', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Donation GET error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const donationId = parseInt(id, 10);

    if (isNaN(donationId)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Only allow updating message for now (administrative corrections)
    const allowedUpdates: Partial<DonationUpdate> = {};
    if (body.message !== undefined) {
      allowedUpdates.message = body.message;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if donation exists
    const { error: fetchError } = await supabase
      .from('donations')
      .select('id')
      .eq('id', donationId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Donation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Failed to fetch donation:', fetchError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch donation', message: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Update the donation
    const { data, error } = await supabase
      .from('donations')
      .update(allowedUpdates)
      .eq('id', donationId)
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
      .single();

    if (error) {
      console.error('Failed to update donation:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to update donation', message: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ message: 'Donation updated successfully', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Donation PATCH error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const donationId = parseInt(id, 10);

    if (isNaN(donationId)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get donation details before deletion to adjust fundraising total
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('id, amount, fundraising')
      .eq('id', donationId)
      .single();
      console.log('Donation fetch error:', fetchError);
      console.log('Donation to delete:', donation);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Donation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Failed to fetch donation:', fetchError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch donation', message: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Delete the donation

    // Update fundraising raised_amount by subtracting the deleted donation
    if (donation.fundraising && donation.amount) {
      const { data: fundData, error: fundFetchError } = await supabase
        .from('fundraising')
        .select('raised_amount')
        .eq('id', donation.fundraising)
        .single();

      if (!fundFetchError && fundData) {
        const newRaised = Math.max(0, (fundData.raised_amount || 0) - donation.amount);

        const { error: updateError } = await supabase
          .from('fundraising')
          .update({ raised_amount: newRaised })
          .eq('id', donation.fundraising);

        if (updateError) {
          console.error(
            'Failed to update fundraising total after donation deletion:',
            updateError.message,
          );
          // Non-fatal error - donation is already deleted
        }
      }
    }
    const { error: deleteError } = await supabase.from('donations').delete().eq('id', donationId);

    if (deleteError) {
      console.error('Failed to delete donation:', deleteError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to delete donation', message: deleteError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ message: 'Donation deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Donation DELETE error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundraising, amount, donor_name, note } = body as {
      fundraising: number;
      amount: number;
      donor_name?: string | null;
      note?: string | null;
    };

    if (!fundraising || !amount || isNaN(Number(amount))) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    // Insert donation record
    const insertPayload: Record<string, unknown> = {
      fundraising,
      amount: Number(amount),
    };

    // Map incoming optional fields to the actual donations table columns.
    if (donor_name) insertPayload['donor'] = donor_name;
    if (note) insertPayload['message'] = note;

    const { data: donation, error: insertError } = await supabase
      .from('donations')
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert donation:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create donation', message: insertError.message }),
        {
          status: 400,
        },
      );
    }

    // Read current raised_amount then update with the new sum.
    // Note: this is not strictly atomic but acceptable for admin manual donations.
    const { data: currentFund, error: fetchError } = await supabase
      .from('fundraising')
      .select('raised_amount')
      .eq('id', fundraising)
      .single();
    if (fetchError) {
      console.error('Failed to read fundraising raised_amount:', fetchError.message);
      return new Response(
        JSON.stringify({
          message: 'Donation created but failed to update fundraising',
          donation,
          fetchError: fetchError.message,
        }),
        { status: 201 },
      );
    }

    const currentRaised =
      (currentFund && (currentFund as { raised_amount?: number }).raised_amount) ?? 0;
    const newRaised = Number(currentRaised) + Number(amount);

    const { data: updated, error: updateError } = await supabase
      .from('fundraising')
      .update({ raised_amount: newRaised })
      .eq('id', fundraising)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update fundraising raised_amount:', updateError.message);
      // Not fatal: return donation but inform update failed
      return new Response(
        JSON.stringify({
          message: 'Donation created but failed to update fundraising',
          donation,
          updateError: updateError.message,
        }),
        { status: 201 },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Donation created', donation, fundraising: updated }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Donation POST error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

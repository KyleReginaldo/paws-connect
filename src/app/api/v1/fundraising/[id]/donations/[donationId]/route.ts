import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; donationId: string }> },
) {
  try {
    const { id, donationId } = await params;
    const fundraisingId = parseInt(id);
    const donationIdNum = parseInt(donationId); 
    if (isNaN(donationIdNum)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID' }), { status: 400 });
    }

    // Fetch the donation to get its amount before deleting
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('id, amount, fundraising')
      .eq('id', donationIdNum)
      .single();

    if (fetchError || !donation) {
      return new Response(
        JSON.stringify({ error: 'Donation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Delete the donation
    const { error: deleteError } = await supabase
      .from('donations')
      .delete()
      .eq('id', donationIdNum);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete donation', message: deleteError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Decrease the raised_amount on the linked fundraising campaign
    const targetFundraisingId = donation.fundraising || fundraisingId;
    if (targetFundraisingId && donation.amount) {
      const { data: fundraising } = await supabase
        .from('fundraising')
        .select('id, raised_amount, status')
        .eq('id', targetFundraisingId)
        .single();

      if (fundraising) {
        const currentRaised = fundraising.raised_amount || 0;
        const newRaised = Math.max(0, currentRaised - donation.amount);

        const updateData: Record<string, unknown> = { raised_amount: newRaised };

        // If campaign was COMPLETE but raised amount now falls below target, revert to ONGOING
        if (fundraising.status === 'COMPLETE') {
          updateData.status = 'ONGOING';
        }

        await supabase
          .from('fundraising')
          .update(updateData)
          .eq('id', targetFundraisingId);
      }
    }

    return new Response(JSON.stringify({ message: 'Donation deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Error deleting donation:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
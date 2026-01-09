import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> },
) {
  try {
    const { donationId } = await params;
    const donationIdNum = parseInt(donationId); 
    if (isNaN(donationIdNum)) {
      return new Response(JSON.stringify({ error: 'Invalid donation ID' }), { status: 400 });
    }

   await supabase.from('donations').delete().eq('id', donationIdNum);
    return new Response(JSON.stringify({ message: 'Donation deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.log();
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}
import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pollId = Number(id);

  if (Number.isNaN(pollId)) {
    return new Response(
      JSON.stringify({ error: "Invalid poll ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch the poll to get suggested_name and pet id
  const { data: poll, error: pollError } = await supabase
    .from('poll')
    .select('id, pet, suggested_name')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return new Response(
      JSON.stringify({ error: "Poll not found", message: pollError?.message }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!poll.pet || !poll.suggested_name) {
    return new Response(
      JSON.stringify({ error: "Poll is missing pet or suggested_name" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Update the pet name with the suggested name
  const { data: updatedPet, error: updateError } = await supabase
    .from('pets')
    .update({ name: poll.suggested_name })
    .eq('id', poll.pet)
    .select('id, name')
    .single();

  if (updateError || !updatedPet) {
    return new Response(
      JSON.stringify({ error: "Failed to update pet name", message: updateError?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Optional cleanup: leave the poll for record-keeping; admins can delete separately
  return new Response(
    JSON.stringify({ message: "Pet name updated from poll", pet: updatedPet, poll }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

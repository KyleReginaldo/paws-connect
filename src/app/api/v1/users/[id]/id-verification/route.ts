import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const body = await request.json();

    const parsed = body as {
      id_attachment_url?: string;
      first_name?: string;
      last_name?: string;
      middle_initial?: string;
      address?: string | null;
      date_of_birth?: string | null;
      status?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
      id_type?: string | null;

    };

    if (!parsed.id_attachment_url || !parsed.first_name || !parsed.last_name) {
      return createErrorResponse('Missing required fields for ID verification', 400);
    }

    const { data, error } = await supabase
      .from("user_identification")
      .upsert(
        {
          user: id,
          id_attachment_url: parsed.id_attachment_url,
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          middle_initial: parsed.middle_initial??null,
          address: parsed.address ?? null,
          date_of_birth: parsed.date_of_birth ?? null,
          status: parsed.status ?? 'PENDING',
          id_type: parsed.id_type ?? null,
        },
        { onConflict: "user" },
      )
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to save ID verification data', 400, error.message);
    }
    return createResponse({message: 'ID verification data saved', data: data}, 200);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}
import { supabase } from "@/app/supabase/supabase";
import { PhilippineIDType } from "@/config/enum/id-verification.enum";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const body = await request.json();

    const parsed = body as {
        id_number: string;
        id_attachment_url: string;
        id_name: string;
        id_expiration?: string;
        id_type: PhilippineIDType;
    };
    const {data,error} = await supabase.from('user_identification').insert({
      id_number: parsed.id_number,
      id_attachment_url: parsed.id_attachment_url,
      id_name: parsed.id_name,
      id_expiration: parsed.id_expiration,
      id_type: parsed.id_type,
      user: id
    }).select().single();
    if(error){
      return createErrorResponse('Failed to insert ID verification data', 400, error.message);
    }
    return createResponse({message: 'ID verification data received', data: data}, 200);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}
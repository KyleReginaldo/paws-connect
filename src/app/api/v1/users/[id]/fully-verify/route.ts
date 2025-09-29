import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const {data, error} = await supabase.from('users').update({
      status: 'FULLY_VERIFIED'
    }).eq('id',id).select().single();
   if(error){
     return createErrorResponse('Failed to update user status', 400, error.message);
   }
   return createResponse({message: 'User status updated', data}, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

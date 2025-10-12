import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { sendStatusChangeEmail } from "@/lib/email-utils";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get user details for email notification
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', id)
      .single();

    if (userError || !userDetails) {
      return createErrorResponse('User not found', 404, userError?.message);
    }

    const {data, error} = await supabase.from('users').update({
      status: 'SEMI_VERIFIED'
    }).eq('id',id).select().single();
   if(error){
     return createErrorResponse('Failed to update user status', 400, error.message);
   }

   // Send email notification
   try {
     if (userDetails.email) {
       await sendStatusChangeEmail(
         userDetails.email,
         userDetails.username || 'User',
         'SEMI_VERIFIED'
       );
     }
   } catch (emailError) {
     console.error('Failed to send status change email:', emailError);
     // Don't fail the entire request if email fails
   }

   return createResponse({message: 'User status updated', data}, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

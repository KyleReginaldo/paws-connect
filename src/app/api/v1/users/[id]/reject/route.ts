import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { sendStatusChangeEmail } from "@/lib/email-utils";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get user details for notification
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', id)
      .single();

    if (userError || !userDetails) {
      return createErrorResponse('User not found', 404, userError?.message);
    }

    // Update user identification status
    await supabase.from('user_identification').update({
      status: 'REJECTED',
    }).eq('user',id);
    
    // Update user status
    const {data, error} = await supabase.from('users').update({
      status: 'PENDING'
    }).eq('id',id).select().single();
    
    if(error){
     return createErrorResponse('Failed to update user status', 400, error.message);
    }

    // Send verification rejection notification
    try {
      const notificationTitle = '❌ Verification Update';
      const notificationMessage = `Hello ${userDetails.username || 'there'}, your account verification was not approved. Please check your submitted documents and try again with valid identification.`;

      // Send push notification
      await pushNotification(
        id,
        notificationTitle,
        notificationMessage,
        '/profile/verification'
      );

      // Store in-app notification
      await storeNotification(
        id,
        notificationTitle,
        notificationMessage
      );

      // Send email notification
      if (userDetails.email) {
        await sendStatusChangeEmail(
          userDetails.email,
          userDetails.username || 'User',
          'PENDING'
        );
      }
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return createResponse({message: 'User status updated', data}, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from "@/app/supabase/supabase";
import { addUserToGlobalForum, createErrorResponse, createResponse } from "@/lib/db-utils";
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
    const{error:verError} = await supabase.from('user_identification').update({
      status: 'ACCEPTED',
    }).eq('user',id);
    
    if(verError){
      return createErrorResponse('Failed to update user status', 400, verError.message);
    }
    
    // Update user status
    const {data, error} = await supabase.from('users').update({
      status: 'FULLY_VERIFIED'
    }).eq('id',id).select().single();
    
    if(error){
     return createErrorResponse('Failed to update user status', 400, error.message);
    }

    // Send verification approval notification
    try {
      const notificationTitle = '✅ Account Verified!';
      const notificationMessage = `Congratulations ${userDetails.username || 'there'}! Your account has been fully verified. You now have full access to all features.`;

      // Send push notification
      await pushNotification(
        id,
        notificationTitle,
        notificationMessage,
        '/profile'
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
          'FULLY_VERIFIED'
        );
      }
    } catch (notificationError) {
      console.error('Failed to send verification notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    // Add user to global forum since they are now FULLY_VERIFIED
    console.log(`🌍 User ${id} is now FULLY_VERIFIED, adding to global forum...`);
    try {
      const addedToForum = await addUserToGlobalForum(id);
      if (addedToForum) {
        console.log('✅ User successfully added to global forum');
      } else {
        console.warn('⚠️ Failed to add user to global forum, but continuing with verification');
      }
    } catch (forumError) {
      console.error('❌ Error adding user to global forum:', forumError);
      // Continue with verification even if forum addition fails
    }

    return createResponse({message: 'User status updated', data}, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

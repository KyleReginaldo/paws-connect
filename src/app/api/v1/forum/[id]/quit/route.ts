import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse, invalidateForumCache } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// POST /api/v1/forum/[id]/quit - Allow a member to quit/leave a forum
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const forumId = Number(id);
    
    if (Number.isNaN(forumId)) {
      return createErrorResponse('Invalid forum ID', 400);
    }

    const body = await parseJson(request);
    if (!body) {
      return createErrorResponse('Invalid JSON', 400);
    }

    // Validate request body
    const quitSchema = z.object({
      user_id: z.uuid('Invalid user ID'),
    }).strict();

    const parsed = quitSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { user_id } = parsed.data;

    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Check if the user is the forum creator
    const isCreator = forum.created_by === user_id;
    
    if (isCreator) {
      // Find the longest member (oldest by join date) to promote as new admin
      const { data: longestMember, error: longestMemberError } = await supabase
        .from('forum_members')
        .select(`
          id, 
          member,
          created_at,
          users!forum_members_member_fkey(id, username, email)
        `)
        .eq('forum', forumId)
        .neq('member', user_id) // Exclude the current creator
        .eq('invitation_status', 'APPROVED')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (longestMemberError || !longestMember) {
        // No other members exist, prevent creator from leaving
        return createErrorResponse('Cannot quit forum as creator when no other members exist. Consider deleting the forum instead.', 403);
      }

      // Transfer ownership to the longest member
      const { error: transferError } = await supabase
        .from('forum')
        .update({ created_by: longestMember.member })
        .eq('id', forumId);

      if (transferError) {
        return createErrorResponse('Failed to transfer forum ownership', 500, transferError.message);
      }

      // Send notification to the new admin
      try {
        const notificationTitle = '👑 You are now a Forum Admin!';
        const notificationMessage = `You have been promoted to admin of the forum. The previous admin has left and you are now in charge. Welcome to your new role!`;

        // Send push notification
        await pushNotification(
          longestMember.member,
          notificationTitle,
          notificationMessage,
          `/forum/${forumId}`
        );

        // Store in-app notification
        await storeNotification(
          longestMember.member,
          notificationTitle,
          notificationMessage
        );
      } catch (notificationError) {
        console.error('Failed to notify new forum admin:', notificationError);
        // Don't fail the entire request if notification fails
      }
    }

    // Check if user is actually a member of this forum
    const { data: membership, error: membershipError } = await supabase
      .from('forum_members')
      .select('id, member, invitation_status')
      .eq('forum', forumId)
      .eq('member', user_id)
      .single();

    if (membershipError || !membership) {
      return createErrorResponse('You are not a member of this forum', 404);
    }

    // Remove the user from the forum
    const { data: removedMember, error: removeError } = await supabase
      .from('forum_members')
      .delete()
      .eq('id', membership.id)
      .eq('forum', forumId)
      .select('id, member')
      .single();

    if (removeError) {
      return createErrorResponse('Failed to quit forum', 500, removeError.message);
    }

    // Invalidate forum cache to ensure fresh data
    invalidateForumCache(forumId);

    // Prepare response message based on whether user was creator
    const message = isCreator 
      ? 'Successfully quit the forum and transferred ownership to the longest member'
      : 'Successfully quit the forum';

    return createResponse({
      message,
      data: {
        forum_id: forumId,
        user_id: user_id,
        quit_at: new Date().toISOString(),
        removed_membership: removedMember,
        ...(isCreator && { ownership_transferred: true })
      }
    }, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
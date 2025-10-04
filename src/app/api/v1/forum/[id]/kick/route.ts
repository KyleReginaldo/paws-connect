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

// POST /api/v1/forum/[id]/kick - Allow forum moderators/creators to kick members
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
    const kickSchema = z.object({
      user_id: z.uuid('Invalid user ID'),
      kicked_by: z.uuid('Invalid kicker user ID'),
      reason: z.string().optional(),
    }).strict();

    const parsed = kickSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { user_id, kicked_by, reason } = parsed.data;

    // Prevent self-kick
    if (user_id === kicked_by) {
      return createErrorResponse('You cannot kick yourself', 400);
    }

    // Check if forum exists and get forum details
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by, forum_name')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Check if the person doing the kicking has permission (must be forum creator)
    if (forum.created_by !== kicked_by) {
      return createErrorResponse('Only the forum creator can kick members', 403);
    }

    // Prevent forum creator from being kicked
    if (forum.created_by === user_id) {
      return createErrorResponse('Forum creators cannot be kicked', 403);
    }

    // Check if target user is actually a member of this forum
    const { data: membership, error: membershipError } = await supabase
      .from('forum_members')
      .select('id, member, invitation_status')
      .eq('forum', forumId)
      .eq('member', user_id)
      .single();

    if (membershipError || !membership) {
      return createErrorResponse('User is not a member of this forum', 404);
    }

    // Get user details for notification
    const { data: kickedUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', user_id)
      .single();

    if (userError || !kickedUser) {
      return createErrorResponse('Kicked user not found', 404);
    }

    // Get kicker details for audit trail
    const { data: kickerUser, error: kickerError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', kicked_by)
      .single();

    if (kickerError || !kickerUser) {
      return createErrorResponse('Kicker user not found', 404);
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
      return createErrorResponse('Failed to kick member', 500, removeError.message);
    }

    // Create a log entry for the kick action (optional - you may want to create a forum_actions table)
    const logData = {
      forum_id: forumId,
      action: 'kick',
      target_user: user_id,
      performed_by: kicked_by,
      reason: reason || null,
      timestamp: new Date().toISOString()
    };

    // Send notifications to the kicked user
    try {
      const notificationTitle = `Removed from Forum: ${forum.forum_name || 'Unknown Forum'}`;
      const notificationMessage = reason 
        ? `You have been removed from the forum "${forum.forum_name || 'Unknown Forum'}" by ${kickerUser.username}. Reason: ${reason}`
        : `You have been removed from the forum "${forum.forum_name || 'Unknown Forum'}" by ${kickerUser.username}.`;

      // Send push notification
      await pushNotification(
        user_id,
        notificationTitle,
        notificationMessage,
        '/forum'
      );

      // Store in-app notification
      await storeNotification(
        user_id,
        notificationTitle,
        notificationMessage
      );
    } catch (notificationError) {
      console.error('Failed to send kick notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    // Invalidate forum cache to ensure fresh data
    invalidateForumCache(forumId);

    return createResponse({
      message: 'Member successfully kicked from forum',
      data: {
        forum_id: forumId,
        forum_name: forum.forum_name,
        kicked_user: {
          id: user_id,
          username: kickedUser.username
        },
        kicked_by: {
          id: kicked_by,
          username: kickerUser.username
        },
        reason: reason || null,
        kicked_at: new Date().toISOString(),
        log: logData,
        removed_membership: removedMember
      }
    }, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
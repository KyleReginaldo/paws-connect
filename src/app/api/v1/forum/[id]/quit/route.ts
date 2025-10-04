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

    // Prevent forum creator from quitting their own forum
    if (forum.created_by === user_id) {
      return createErrorResponse('Forum creators cannot quit their own forum. Consider transferring ownership or deleting the forum instead.', 403);
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

    return createResponse({
      message: 'Successfully quit the forum',
      data: {
        forum_id: forumId,
        user_id: user_id,
        quit_at: new Date().toISOString(),
        removed_membership: removedMember
      }
    }, 200);

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
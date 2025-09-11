/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// GET /api/v1/forum/[id]/members/[memberId] - Get specific member info
export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const memberId = Number((params as { memberId: string }).memberId);
    
    if (Number.isNaN(forumId) || Number.isNaN(memberId)) {
      return createErrorResponse('Invalid id', 400);
    }

    const { data, error } = await supabase
      .from('forum_members')
      .select(`
        id,
        created_at,
        member,
        users!forum_members_member_fkey (
          id,
          username,
          profile_image_link
        )
      `)
      .eq('id', memberId)
      .eq('forum', forumId)
      .single();

    if (error) {
      return createErrorResponse(error.message, 500);
    }

    if (!data) {
      return createErrorResponse('Member not found', 404);
    }

    return createResponse({ data }, 200, {
      cache: 'private, max-age=300'
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

// DELETE /api/v1/forum/[id]/members/[memberId] - Remove a member from a forum
export async function DELETE(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const memberId = Number((params as { memberId: string }).memberId);
    
    if (Number.isNaN(forumId) || Number.isNaN(memberId)) {
      return createErrorResponse('Invalid id', 400);
    }

    // Get requester ID from query params or body
    const body = await parseJson(request);
    const url = new URL(request.url);
    const requesterId = body?.requester_id || url.searchParams.get('requester_id');

    if (!requesterId) {
      return createErrorResponse('Requester ID is required', 400);
    }

    // Validate requester ID
    const requesterSchema = z.string().uuid('Invalid requester ID');
    const parsedRequesterId = requesterSchema.safeParse(requesterId);
    if (!parsedRequesterId.success) {
      return createErrorResponse('Invalid requester ID format', 400);
    }

    // Check if forum exists and get forum info
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Get member info
    const { data: memberInfo, error: memberError } = await supabase
      .from('forum_members')
      .select('member')
      .eq('id', memberId)
      .eq('forum', forumId)
      .single();

    if (memberError || !memberInfo) {
      return createErrorResponse('Member not found', 404);
    }

    // Check permissions: only forum creator or the member themselves can remove
    const isForumCreator = forum.created_by === parsedRequesterId.data;
    const isMemberThemselves = memberInfo.member === parsedRequesterId.data;

    if (!isForumCreator && !isMemberThemselves) {
      return createErrorResponse('Unauthorized: Only the forum creator or the member themselves can remove membership', 403);
    }

    // Remove member from forum
    const { data, error } = await supabase
      .from('forum_members')
      .delete()
      .eq('id', memberId)
      .eq('forum', forumId)
      .select('id, member')
      .single();

    if (error) {
      return createErrorResponse(error.message, 500);
    }

    return createResponse({
      message: 'Member removed successfully',
      data
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

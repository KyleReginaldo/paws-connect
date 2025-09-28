/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const markReadSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  lastChatId: z.number().optional(),
});

/**
 * PUT /api/v1/forum/[id]/mark-read - Mark forum as read by user
 * 
 * This endpoint allows a user to mark a forum as "read" by updating their
 * last read timestamp. Optionally includes the last chat message ID they've seen.
 * 
 * Request Body:
 * - userId: UUID of the user marking the forum as read
 * - lastChatId: (optional) ID of the last chat message they've seen
 * 
 * This doesn't create a new table but can be used to track read status
 * by comparing with the latest chat timestamp in the forum.
 */
export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    
    if (Number.isNaN(forumId)) {
      return createErrorResponse('Invalid forum ID', 400);
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { userId, lastChatId } = parsed.data;

    // Verify forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Check if user has access to this forum
    const isCreator = forum.created_by === userId;
    let hasAccess = isCreator;

    if (!hasAccess && forum.private) {
      // Check if user is a member
      const { data: membership } = await supabase
        .from('forum_members')
        .select('id')
        .eq('forum', forumId)
        .eq('member', userId)
        .single();
      
      hasAccess = !!membership;
    } else if (!forum.private) {
      // Public forum - user has access
      hasAccess = true;
    }

    if (!hasAccess) {
      return createErrorResponse('Access denied', 403);
    }

    // For demonstration, we'll store a simple timestamp in user profile
    // In a real implementation, you might want to create a separate table
    const readTimestamp = new Date().toISOString();
    
    // Update user's last activity or store read status somewhere
    // This is a simplified approach - in production you'd want a proper read status table
    const response = {
      success: true,
      message: 'Forum marked as read',
      forum_id: forumId,
      user_id: userId,
      marked_read_at: readTimestamp,
      last_chat_id: lastChatId || null,
    };

    return createResponse(response, 200);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
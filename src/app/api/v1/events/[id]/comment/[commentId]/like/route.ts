import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";
import z from "zod";

// POST /api/v1/events/[id]/comment/[commentId]/like - Toggle like on a comment
export async function POST(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const { id, commentId } = await params;
        const body = await request.json();
        
        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        if (!commentId || isNaN(Number(commentId))) {
            return createErrorResponse('Valid comment ID is required', 400);
        }

        const likeSchema = z.object({
            user_id: z.string().uuid('Invalid user ID format'),
        }).strict();

        const likeBody = likeSchema.safeParse(body);
        if (!likeBody.success) {
            return createErrorResponse('Invalid like request body', 400, likeBody.error.message);
        }

        const { user_id } = likeBody.data;

        // Check if event exists
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title')
            .eq('id', Number(id))
            .single();

        if (eventError || !event) {
            return createErrorResponse('Event not found', 404);
        }

        // Check if comment exists and belongs to this event
        const { data: comment, error: commentError } = await supabase
            .from('event_comments')
            .select('id, content, likes, user')
            .eq('id', Number(commentId))
            .eq('event', Number(id))
            .single();

        if (commentError || !comment) {
            return createErrorResponse('Comment not found', 404);
        }

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', user_id)
            .single();

        if (userError || !user) {
            return createErrorResponse('User not found', 404);
        }

        const currentLikes = comment.likes || [];
        let updatedLikes: string[];
        let action: 'liked' | 'unliked';

        // Toggle like - if user already liked, remove like; otherwise add like
        if (currentLikes.includes(user_id)) {
            // User already liked, so unlike
            updatedLikes = currentLikes.filter(id => id !== user_id);
            action = 'unliked';
        } else {
            // User hasn't liked yet, so like
            updatedLikes = [...currentLikes, user_id];
            action = 'liked';
        }

        // Update the comment with new likes
        const { data: updatedComment, error: updateError } = await supabase
            .from('event_comments')
            .update({ likes: updatedLikes })
            .eq('id', Number(commentId))
            .select(`
                id,
                content,
                likes,
                created_at,
                user:users(id, username, profile_image_link)
            `)
            .single();

        if (updateError) {
            return createErrorResponse('Failed to update comment likes', 400, updateError.message);
        }

        return createResponse({ 
            message: `Comment ${action} successfully`, 
            data: {
                event_id: Number(id),
                comment_id: Number(commentId),
                user_id,
                action,
                likes_count: updatedLikes.length,
                comment: updatedComment
            }
        }, 200);

    } catch (err) {
        console.error('Comment like error:', err);
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: err instanceof Error ? err.message : 'An unexpected error occurred' 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// GET /api/v1/events/[id]/comment/[commentId]/like - Get likes for a comment
export async function GET(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const { id, commentId } = await params;
        
        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        if (!commentId || isNaN(Number(commentId))) {
            return createErrorResponse('Valid comment ID is required', 400);
        }

        // Get comment with likes and user details
        const { data: comment, error } = await supabase
            .from('event_comments')
            .select(`
                id,
                content,
                likes,
                created_at,
                event,
                user:users(id, username, profile_image_link)
            `)
            .eq('id', Number(commentId))
            .eq('event', Number(id))
            .single();

        if (error || !comment) {
            return createErrorResponse('Comment not found', 404);
        }

        // Get user details for all likes
        let likesDetails: Array<{ id: string; username: string | null; profile_image_link: string | null }> = [];
        if (comment.likes && comment.likes.length > 0) {
            const { data: likingUsers, error: likingUsersError } = await supabase
                .from('users')
                .select('id, username, profile_image_link')
                .in('id', comment.likes);

            if (!likingUsersError && likingUsers) {
                likesDetails = likingUsers;
            }
        }

        return createResponse({ 
            message: 'Comment likes fetched successfully', 
            data: {
                comment_id: comment.id,
                event_id: comment.event,
                likes_count: comment.likes?.length || 0,
                likes: comment.likes || [],
                liked_by: likesDetails,
                comment: {
                    id: comment.id,
                    content: comment.content,
                    created_at: comment.created_at,
                    user: comment.user
                }
            }
        }, 200);

    } catch (err) {
        console.error('Get comment likes error:', err);
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: err instanceof Error ? err.message : 'An unexpected error occurred' 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
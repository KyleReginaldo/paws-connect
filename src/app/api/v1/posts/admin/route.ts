import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

/**
 * Admin-specific endpoint for fetching posts with enriched user data
 * This endpoint automatically includes username and profile_image for reactions and comments
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return createErrorResponse('Failed to fetch posts', 400, error.message);
        }

        // Enrich reactions and comments with user details
        if (data && data.length > 0) {
            console.log('[posts admin API] Enriching user data for reactions and comments');
            
            // Collect all unique user IDs from reactions and comments
            const userIds = new Set<string>();
            data.forEach(post => {
                if (Array.isArray(post.reactions)) {
                    post.reactions.forEach((r: any) => {
                        if (r.user_id) userIds.add(r.user_id);
                    });
                }
                if (Array.isArray(post.comments)) {
                    post.comments.forEach((c: any) => {
                        if (c.user_id) userIds.add(c.user_id);
                    });
                }
            });

            // Fetch user details for all unique user IDs
            if (userIds.size > 0) {
                const { data: users, error: userError } = await supabase
                    .from('users')
                    .select('id, username, profile_image_link')
                    .in('id', Array.from(userIds));

                if (!userError && users) {
                    // Create a map of user_id to user details
                    const userMap = new Map(users.map(u => [
                        u.id, 
                        { 
                            username: u.username || 'Unknown User', 
                            profile_image: u.profile_image_link 
                        }
                    ]));

                    // Enrich reactions and comments with user details
                    data.forEach(post => {
                        if (Array.isArray(post.reactions)) {
                            post.reactions = post.reactions.map((r: any) => {
                                const userDetails = userMap.get(r.user_id);
                                return {
                                    ...r,
                                    username: userDetails?.username || r.user_id || 'Unknown User',
                                    profile_image: userDetails?.profile_image || null,
                                };
                            });
                        }
                        if (Array.isArray(post.comments)) {
                            post.comments = post.comments.map((c: any) => {
                                const userDetails = userMap.get(c.user_id);
                                return {
                                    ...c,
                                    username: userDetails?.username || c.user_id || 'Unknown User',
                                    profile_image: userDetails?.profile_image || null,
                                };
                            });
                        }
                    });

                    console.log('[posts admin API] Enriched user data for', userIds.size, 'users');
                } else {
                    console.error('[posts admin API] Failed to fetch user details:', userError);
                }
            }
        }

        return createResponse({ message: 'Posts fetched successfully', data }, 200);
    } catch (err) {
        console.error('[posts admin API] Error:', err);
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: (err as Error).message 
            }),
            { status: 500 },
        );
    }
}

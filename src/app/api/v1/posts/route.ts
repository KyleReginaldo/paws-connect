import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

// Helper function to notify all users about new posts
async function notifyAllUsersNewPost(postTitle: string, postId: number, category: string) {
    try {
        console.log('🚀 Starting post notification process for:', postTitle);
        
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE');

        if (error || !users) {
            console.error('❌ Error fetching users for post notification:', error);
            return;
        }

        console.log(`👥 Found ${users.length} users to notify`);

        // Get category display name
        const categoryNames: Record<string, string> = {
            shelter_update: 'Shelter Update',
            adoption_update: 'Adoption Update',
            rescue_stories: 'Rescue Story',
            health_alerts: 'Health Alert',
        };

        const categoryEmojis: Record<string, string> = {
            shelter_update: '🏠',
            adoption_update: '🐾',
            rescue_stories: '❤️',
            health_alerts: '⚕️',
        };

        const emoji = categoryEmojis[category] || '📢';
        const categoryName = categoryNames[category] || category;

        const notificationTitle = `${emoji} New ${categoryName}`;
        const notificationMessage = `"${postTitle}" - Check out the latest update!`;

        console.log('📧 Notification title:', notificationTitle);
        console.log('📧 Notification message:', notificationMessage);

        // Import push notification functions
        const { pushNotificationtoAll, storeNotification } = await import('@/app/api/helper');
        await pushNotificationtoAll(
            notificationTitle,
            notificationMessage,
        );
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            console.log(`📤 Sending batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
            
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage
                        );
                    } catch (err) {
                        console.error(`Failed to notify user ${user.id} (post):`, err);
                    }
                })
            );
        }

        console.log(`✅ Post notification sent to ${users.length} users for: ${postTitle}`);
    } catch (err) {
        console.error('❌ Error in notifyAllUsersNewPost:', err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, category, description, images, links } = body;

        if (!title || !category || !description) {
            return createErrorResponse('Title, category, and description are required', 400);
        }

        // Insert the post
        const { data, error } = await supabase
            .from('posts')
            .insert({
                title: title.trim(),
                category,
                description: description.trim(),
                images: images && images.length > 0 ? images : null,
                links: links && links.length > 0 ? links : null,
            })
            .select()
            .single();

        if (error) {
            return createErrorResponse('Failed to create post', 400, error.message);
        }

        console.log('✅ Successfully created post:', data.id);

        // Notify all users about the new post (run in background)
        console.log('📤 Triggering post notifications for:', title);
        notifyAllUsersNewPost(title, data.id, category).catch(error => {
            console.error('❌ Failed to send post notifications:', error);
        });

        return createResponse({ 
            message: 'Post created successfully', 
            data
        }, 201);
    } catch (err) {
        console.error('❌ Post POST error:', err);
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error',
                message: err instanceof Error ? err.message : 'An unexpected error occurred',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}

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

        return createResponse({ message: 'Posts fetched successfully', data }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: (err as Error).message 
            }),
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, category, description, images, links } = body;

        if (!id) {
            return createErrorResponse('Post ID is required', 400);
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title.trim();
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description.trim();
        if (images !== undefined) updateData.images = images && images.length > 0 ? images : null;
        if (links !== undefined) updateData.links = links && links.length > 0 ? links : null;

        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return createErrorResponse('Failed to update post', 400, error.message);
        }

        return createResponse({ message: 'Post updated successfully', data }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: (err as Error).message 
            }),
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return createErrorResponse('Post ID is required', 400);
        }

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            return createErrorResponse('Failed to delete post', 400, error.message);
        }

        return createResponse({ message: 'Post deleted successfully' }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error', 
                message: (err as Error).message 
            }),
            { status: 500 },
        );
    }
}

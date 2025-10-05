import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { regenerateEventSuggestions } from "@/lib/openai-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        const { data, error } = await supabase
            .from('events')
            .select(`
                id,
                title,
                description,
                images,
                suggestions,
                starting_date,
                ended_at,
                created_at,
                created_by,
                users!events_created_by_fkey(
                    id,
                    username,
                    profile_image_link
                ),
                comments:event_comments(id, content, likes, created_at, user:users(id, username, profile_image_link)),
                members:event_members(id, user:users(id, username, profile_image_link), joined_at)
            `)
            .eq('id', Number(id))
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return createErrorResponse('Event not found', 404);
            }
            return createErrorResponse('Failed to fetch event', 400, error.message);
        }

        return createResponse({ message: 'Event fetched successfully', data }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        const { images, title, description } = body;

        if (!title && !images && !description) {
            return createErrorResponse('At least one field (title, description, or images) must be provided for update', 400);
        }

        // Get current event data to determine if we need to regenerate suggestions
        const { data: currentEvent, error: fetchError } = await supabase
            .from('events')
            .select('title, description')
            .eq('id', Number(id))
            .single();

        if (fetchError) {
            return createErrorResponse('Event not found', 404);
        }

        const updateData: Partial<{
            title: string;
            description: string | null;
            images: string[];
            suggestions: string[] | null;
        }> = {};
        
        let shouldRegenerateSuggestions = false;
        
        if (title !== undefined) {
            updateData.title = title;
            shouldRegenerateSuggestions = title !== currentEvent.title;
        }
        
        if (description !== undefined) {
            updateData.description = description;
            shouldRegenerateSuggestions = shouldRegenerateSuggestions || description !== currentEvent.description;
        }
        
        if (images !== undefined) {
            if (!Array.isArray(images)) {
                return createErrorResponse('Images must be an array', 400);
            }
            updateData.images = images;
        }

        // Regenerate AI suggestions if title or description changed
        if (shouldRegenerateSuggestions) {
            const finalTitle = title !== undefined ? title : currentEvent.title;
            const finalDescription = description !== undefined ? description : currentEvent.description;
            const aiSuggestions = await regenerateEventSuggestions(Number(id), finalTitle, finalDescription);
            updateData.suggestions = aiSuggestions;
        }

        const { data, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', Number(id))
            .select(`
                id,
                title,
                description,
                images,
                suggestions,
                starting_date,
                ended_at,
                created_at,
                created_by,
                users!events_created_by_fkey(
                    id,
                    username,
                    profile_image_link
                )
            `)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return createErrorResponse('Event not found', 404);
            }
            return createErrorResponse('Failed to update event', 400, error.message);
        }

        return createResponse({ 
            message: 'Event updated successfully', 
            data,
            ai_suggestions_regenerated: shouldRegenerateSuggestions
        }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

// POST /api/v1/events/[id] - Join an event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { user_id } = body;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        if (!user_id) {
            return createErrorResponse('User ID is required', 400);
        }

        // Check if event exists
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title')
            .eq('id', Number(id))
            .single();

        if (eventError || !event) {
            return createErrorResponse('Event not found', 404);
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

        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from('event_members')
            .select('id')
            .eq('event', Number(id))
            .eq('user', user_id)
            .single();

        if (existingMember) {
            return createErrorResponse('User is already a member of this event', 409);
        }

        // Add user to event members
        const { data, error } = await supabase
            .from('event_members')
            .insert({
                event: Number(id),
                user: user_id,
                joined_at: new Date().toISOString()
            })
            .select(`
                id,
                joined_at,
                user:users(id, username, profile_image_link)
            `)
            .single();

        if (error) {
            return createErrorResponse('Failed to join event', 400, error.message);
        }

        return createResponse({ 
            message: 'Successfully joined the event', 
            data: {
                event_id: Number(id),
                event_title: event.title,
                member: data
            }
        }, 201);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

// PATCH /api/v1/events/[id] - Leave an event
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { user_id } = body;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        if (!user_id) {
            return createErrorResponse('User ID is required', 400);
        }

        // Check if event exists
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title')
            .eq('id', Number(id))
            .single();

        if (eventError || !event) {
            return createErrorResponse('Event not found', 404);
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

        // Check if user is actually a member of this event
        const { data: existingMember, error: memberCheckError } = await supabase
            .from('event_members')
            .select('id, joined_at')
            .eq('event', Number(id))
            .eq('user', user_id)
            .single();

        if (memberCheckError || !existingMember) {
            return createErrorResponse('User is not a member of this event', 404);
        }

        // Remove user from event members
        const { data, error } = await supabase
            .from('event_members')
            .delete()
            .eq('event', Number(id))
            .eq('user', user_id)
            .select(`
                id,
                joined_at,
                user:users(id, username, profile_image_link)
            `)
            .single();

        if (error) {
            return createErrorResponse('Failed to leave event', 400, error.message);
        }

        return createResponse({ 
            message: 'Successfully left the event', 
            data: {
                event_id: Number(id),
                event_title: event.title,
                left_member: data,
                left_at: new Date().toISOString()
            }
        }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        const { data, error } = await supabase
            .from('events')
            .delete()
            .eq('id', Number(id))
            .select('id, title')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return createErrorResponse('Event not found', 404);
            }
            return createErrorResponse('Failed to delete event', 400, error.message);
        }

        return createResponse({ message: 'Event deleted successfully', data }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}
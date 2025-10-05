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
                created_at,
                created_by,
                users!events_created_by_fkey(
                    id,
                    username,
                    profile_image_link
                ),
                comments:event_comments(id, content, likes, created_at, user:users(id, username, profile_image_link))
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
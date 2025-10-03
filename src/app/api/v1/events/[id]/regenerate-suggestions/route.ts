import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { regenerateEventSuggestions } from "@/lib/openai-utils";
import { NextRequest } from "next/server";

// POST /api/v1/events/[id]/regenerate-suggestions - Manually regenerate AI suggestions for an event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        const eventId = Number(id);

        // Get current event data
        const { data: event, error: fetchError } = await supabase
            .from('events')
            .select('id, title, description')
            .eq('id', eventId)
            .single();

        if (fetchError || !event) {
            return createErrorResponse('Event not found', 404);
        }

        // Generate new AI suggestions
        const aiSuggestions = await regenerateEventSuggestions(eventId, event.title, event.description);

        if (aiSuggestions === null) {
            return createErrorResponse('Failed to generate AI suggestions. Please try again.', 500);
        }

        // Update event with new suggestions
        const { data: updatedEvent, error: updateError } = await supabase
            .from('events')
            .update({ suggestions: aiSuggestions })
            .eq('id', eventId)
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

        if (updateError) {
            return createErrorResponse('Failed to update event suggestions', 500, updateError.message);
        }

        return createResponse({
            message: 'AI suggestions regenerated successfully',
            data: updatedEvent,
            regenerated_suggestions: aiSuggestions
        }, 200);

    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}
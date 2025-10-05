import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

// POST /api/v1/events/[id]/end - End an event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        // Check if event exists and is not already ended
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, ended_at, created_by')
            .eq('id', Number(id))
            .single();

        if (eventError || !event) {
            return createErrorResponse('Event not found', 404);
        }

        if (event.ended_at) {
            return createErrorResponse('Event has already ended', 409);
        }

        // Verify user has permission to end the event (creator or admin)
      

        // End the event by setting ended_at timestamp
        const { data, error } = await supabase
            .from('events')
            .update({ ended_at: new Date().toISOString() })
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
            return createErrorResponse('Failed to end event', 400, error.message);
        }

        return createResponse({ 
            message: 'Event ended successfully', 
            data
        }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

// PATCH /api/v1/events/[id]/end - Reopen an ended event (remove ended_at)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reopened_by } = body;

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        // Check if event exists and is currently ended
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, ended_at, created_by')
            .eq('id', Number(id))
            .single();

        if (eventError || !event) {
            return createErrorResponse('Event not found', 404);
        }

        if (!event.ended_at) {
            return createErrorResponse('Event is not currently ended', 409);
        }

        // Verify user has permission to reopen the event (creator or admin)
        if (reopened_by) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, role')
                .eq('id', reopened_by)
                .single();

            if (userError || !user) {
                return createErrorResponse('User not found', 404);
            }

            // Check if user is creator or admin/staff (roles 1 or 2)
            const canReopenEvent = event.created_by === reopened_by || user.role === 1 || user.role === 2;
            
            if (!canReopenEvent) {
                return createErrorResponse('You do not have permission to reopen this event', 403);
            }
        }

        // Reopen the event by removing ended_at timestamp
        const { data, error } = await supabase
            .from('events')
            .update({ ended_at: null })
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
            return createErrorResponse('Failed to reopen event', 400, error.message);
        }

        return createResponse({ 
            message: 'Event reopened successfully', 
            data
        }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}
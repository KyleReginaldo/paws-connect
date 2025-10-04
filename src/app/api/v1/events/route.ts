import { notifyAllUsersNewEvent } from "@/app/api/helper";
import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { generateEventSuggestions } from "@/lib/openai-utils";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { images, title, description, created_by } = body;

        if (!title) {
            return createErrorResponse('Title is required', 400);
        }

        // Generate AI suggestions based on event title and description
        const aiSuggestions = await generateEventSuggestions(title, description);

        const { data, error } = await supabase
            .from('events')
            .insert({
                images,
                title,
                description: description || null,
                created_by: created_by || null,
                suggestions: aiSuggestions,
            })
            .select()
            .single();

        if (error) {
            return createErrorResponse('Failed to create event', 400, error.message);
        }

        // Get creator's username for notification
        let creatorName = null;
        if (created_by) {
            const { data: creator } = await supabase
                .from('users')
                .select('username')
                .eq('id', created_by)
                .single();
            creatorName = creator?.username;
        }

        // Notify all users about the new event (run in background)
        notifyAllUsersNewEvent(title, data.id.toString(), creatorName || undefined).catch(error => {
            console.error('Failed to send event notifications:', error);
        });

        return createResponse({ 
            message: 'Event created successfully with AI-generated suggestions', 
            data,
            ai_suggestions_generated: aiSuggestions ? true : false
        }, 201);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search');

        let query = supabase
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
                )
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            return createErrorResponse('Failed to fetch events', 400, error.message);
        }

        return createResponse({ message: 'Events fetched successfully', data }, 200);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
            { status: 500 },
        );
    }
}
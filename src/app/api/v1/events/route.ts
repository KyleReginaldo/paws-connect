import { notifyAllUsersNewEvent } from "@/app/api/helper";
import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { images, title, description, created_by, starting_date, fundraising, pet } = body;

        if (!title) {
            return createErrorResponse('Title is required', 400);
        }

        // Validate starting_date if provided
        let parsedStartingDate = null;
        if (starting_date) {
            const dateObj = new Date(starting_date);
            if (isNaN(dateObj.getTime())) {
                return createErrorResponse('Invalid starting_date format. Please provide a valid date.', 400);
            }
            parsedStartingDate = dateObj.toISOString();
        }

        const { data, error } = await supabase
            .from('events')
            .insert({
                images,
                title,
                description: description || null,
                created_by: created_by || null,
                starting_date: parsedStartingDate,
                fundraising,
                pet,
                
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
            message: 'Event created successfully', 
            data
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
                members:event_members(id, user:users(id, username, profile_image_link), joined_at),
                fundraising(*),
                pet:pets(*)
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
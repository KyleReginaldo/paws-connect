import { notifyAllUsersNewCapstoneLink } from "@/app/api/helper";
import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, link, description, image_link, button_label, created_by } = body;

        if (!title || !link) {
            return createErrorResponse('Title and link are required', 400);
        }

        // Insert the capstone link
        const { data, error } = await supabase
            .from('capstone_links')
            .insert({
                title: title.trim(),
                link: link.trim(),
                description: description?.trim() || null,
                image_link: image_link?.trim() || null,
                button_label: button_label?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            return createErrorResponse('Failed to create capstone link', 400, error.message);
        }

        console.log('✅ Successfully created capstone link:', data.id);

        // Get creator's username for notification
        let creatorName = null;
        if (created_by) {
            const { data: creator } = await supabase
                .from('users')
                .select('username')
                .eq('id', created_by)
                .single();
            creatorName = creator?.username;
            console.log('📧 Capstone link creator:', creatorName);
        }

        // Notify all users about the new capstone link (run in background)
        console.log('📤 Triggering capstone link notifications for:', title);
        notifyAllUsersNewCapstoneLink(title, data.id, creatorName || undefined).catch(error => {
            console.error('❌ Failed to send capstone link notifications:', error);
        });

        return createResponse({ 
            message: 'Capstone link created successfully', 
            data
        }, 201);
    } catch (err) {
        console.error('❌ Capstone link POST error:', err);
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
            .from('capstone_links')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return createErrorResponse('Failed to fetch capstone links', 400, error.message);
        }

        return createResponse({ message: 'Capstone links fetched successfully', data }, 200);
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
            return createErrorResponse('Link ID is required', 400);
        }

        const { error } = await supabase
            .from('capstone_links')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            return createErrorResponse('Failed to delete capstone link', 400, error.message);
        }

        return createResponse({ message: 'Capstone link deleted successfully' }, 200);
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

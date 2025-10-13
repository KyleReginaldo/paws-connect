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
                members:event_members(id, user:users(id, username, profile_image_link), joined_at),
                fundraising(*),
                pet:pets(*)
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
        console.log('=== EVENT UPDATE START ===');
        console.log('📝 Updating event ID:', id);

        if (!id || isNaN(Number(id))) {
            return createErrorResponse('Valid event ID is required', 400);
        }

        const contentType = request.headers.get('content-type');
        const isMultipart = contentType?.includes('multipart/form-data');
        
        let eventData: {
            images?: string[];
            title?: string;
            description?: string;
        };

        if (isMultipart) {
            console.log('📤 Processing multipart/form-data request');
            const fd = await request.formData();
            
            // Extract text fields
            const title = fd.get('title') as string;
            const description = fd.get('description') as string;
            
            // Get existing images that should be preserved
            const existingImages = fd.getAll('existing_images') as string[];
            console.log(`📷 Preserving ${existingImages.length} existing images`);
            
            // Process new image files
            const imageFiles = fd.getAll('images') as File[];
            const newImageUrls: string[] = [];
            
            console.log(`📁 Processing ${imageFiles.length} new image files`);
            for (const file of imageFiles) {
                if (file && file.size > 0) {
                    console.log(`⬆️ Uploading image: ${file.name}, size: ${file.size} bytes`);
                    
                    // Validate file
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                        return new Response(
                            JSON.stringify({
                                error: 'File too large',
                                message: `Image "${file.name}" exceeds 5MB limit`,
                            }),
                            { status: 413, headers: { 'Content-Type': 'application/json' } },
                        );
                    }
                    
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(file.type)) {
                        return new Response(
                            JSON.stringify({
                                error: 'Invalid file type',
                                message: `File "${file.name}" must be JPEG, PNG, or WebP`,
                            }),
                            { status: 400, headers: { 'Content-Type': 'application/json' } },
                        );
                    }
                    
                    // Upload to Supabase storage
                    const fileName = `events/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
                    const fileBuffer = await file.arrayBuffer();
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('files')
                        .upload(fileName, fileBuffer, {
                            contentType: file.type,
                        });
                    
                    if (uploadError) {
                        console.error(`❌ Upload failed for ${file.name}:`, uploadError);
                        return new Response(
                            JSON.stringify({
                                error: 'Upload failed',
                                message: `Failed to upload image "${file.name}": ${uploadError.message}`,
                            }),
                            { status: 500, headers: { 'Content-Type': 'application/json' } },
                        );
                    }
                    
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('files')
                        .getPublicUrl(uploadData.path);
                    
                    newImageUrls.push(urlData.publicUrl);
                    console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);
                }
            }
            
            // Combine existing images with new uploads
            const allImages = [...existingImages, ...newImageUrls];
            console.log(`📷 Final image list: ${existingImages.length} existing + ${newImageUrls.length} new = ${allImages.length} total`);
            
            eventData = {
                images: allImages.length > 0 ? allImages : undefined,
                title: title || undefined,
                description: description || undefined,
            };
            
        } else {
            console.log('📝 Processing JSON request (backward compatibility)');
            const body = await request.json();
            eventData = body;
        }

        console.log('📝 Processed event data:', {
            ...eventData,
            images: eventData.images ? `${eventData.images.length} image(s)` : 'no images',
        });

        if (!eventData.title && !eventData.images && !eventData.description) {
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
        
        if (eventData.title !== undefined) {
            updateData.title = eventData.title;
            shouldRegenerateSuggestions = eventData.title !== currentEvent.title;
        }
        
        if (eventData.description !== undefined) {
            updateData.description = eventData.description;
            shouldRegenerateSuggestions = shouldRegenerateSuggestions || eventData.description !== currentEvent.description;
        }
        
        if (eventData.images !== undefined) {
            if (!Array.isArray(eventData.images)) {
                return createErrorResponse('Images must be an array', 400);
            }
            updateData.images = eventData.images;
        }

        // Regenerate AI suggestions if title or description changed
        if (shouldRegenerateSuggestions) {
            const finalTitle = eventData.title !== undefined ? eventData.title : currentEvent.title;
            const finalDescription = eventData.description !== undefined ? eventData.description : currentEvent.description;
            console.log('🤖 Regenerating AI suggestions for updated event...');
            const aiSuggestions = await regenerateEventSuggestions(Number(id), finalTitle, finalDescription);
            updateData.suggestions = aiSuggestions;
        }

        console.log('💾 Updating database with:', {
            ...updateData,
            images: updateData.images ? `${updateData.images.length} image(s)` : 'unchanged',
        });

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
            console.log('❌ Database update error:', error.message);
            return createErrorResponse('Failed to update event', 400, error.message);
        }

        console.log('✅ Successfully updated event:', data.id);
        console.log('📷 Event images updated:', data.images?.length || 0);
        console.log('=== EVENT UPDATE END ===');

        return createResponse({ 
            message: 'Event updated successfully', 
            data,
            ai_suggestions_regenerated: shouldRegenerateSuggestions
        }, 200);
    } catch (err) {
        console.error('❌ Event PUT error:', err);
        return new Response(
            JSON.stringify({ 
                error: 'Internal Server Error',
                message: err instanceof Error ? err.message : 'An unexpected error occurred',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
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
import { notifyAllUsersNewEvent } from "@/app/api/helper";
import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    try {
        console.log('=== EVENT CREATE START ===');
        
        const contentType = request.headers.get('content-type');
        const isMultipart = contentType?.includes('multipart/form-data');
        
        let eventData: {
            images?: string[];
            title: string;
            description?: string;
            created_by?: string;
            starting_date?: string;
            fundraising?: number;
            pet?: number;
        };

        if (isMultipart) {
            console.log('📤 Processing multipart/form-data request');
            const fd = await request.formData();
            
            // Extract text fields
            const title = fd.get('title') as string;
            const description = fd.get('description') as string;
            const created_by = fd.get('created_by') as string;
            const starting_date = fd.get('starting_date') as string;
            const fundraising = fd.get('fundraising') ? Number(fd.get('fundraising')) : undefined;
            const pet = fd.get('pet') ? Number(fd.get('pet')) : undefined;
            
            // Process image files
            const imageFiles = fd.getAll('images') as File[];
            const imageUrls: string[] = [];
            
            console.log(`📁 Processing ${imageFiles.length} image files`);
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
                    
                    imageUrls.push(urlData.publicUrl);
                    console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);
                }
            }
            
            eventData = {
                images: imageUrls,
                title,
                description: description || undefined,
                created_by: created_by || undefined,
                starting_date: starting_date || undefined,
                fundraising,
                pet,
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

        if (!eventData.title) {
            return createErrorResponse('Title is required', 400);
        }

        // Validate starting_date if provided
        let parsedStartingDate = null;
        if (eventData.starting_date) {
            const dateObj = new Date(eventData.starting_date);
            if (isNaN(dateObj.getTime())) {
                return createErrorResponse('Invalid starting_date format. Please provide a valid date.', 400);
            }
            parsedStartingDate = dateObj.toISOString();
        }

        console.log('💾 Inserting to database...');
        const { data, error } = await supabase
            .from('events')
            .insert({
                images: eventData.images || [],
                title: eventData.title,
                description: eventData.description || null,
                created_by: eventData.created_by || null,
                starting_date: parsedStartingDate,
                fundraising: eventData.fundraising,
                pet: eventData.pet,
            })
            .select()
            .single();

        if (error) {
            console.log('❌ Database insert error:', error.message);
            return createErrorResponse('Failed to create event', 400, error.message);
        }

        console.log('✅ Successfully created event:', data.id);
        console.log('📷 Event images saved:', data.images?.length || 0);

        // Get creator's username for notification
        let creatorName = null;
        if (eventData.created_by) {
            const { data: creator } = await supabase
                .from('users')
                .select('username')
                .eq('id', eventData.created_by)
                .single();
            creatorName = creator?.username;
            console.log('📧 Event creator:', creatorName);
        }

        // Notify all users about the new event (run in background)
        console.log('📤 Triggering event notifications for:', eventData.title);
        notifyAllUsersNewEvent(eventData.title, data.id.toString(), creatorName || undefined).catch(error => {
            console.error('❌ Failed to send event notifications:', error);
        });

        console.log('=== EVENT CREATE END ===');
        return createResponse({ 
            message: 'Event created successfully', 
            data
        }, 201);
    } catch (err) {
        console.error('❌ Event POST error:', err);
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
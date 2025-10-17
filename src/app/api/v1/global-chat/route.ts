import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from '@/app/supabase/supabase';
import { getStandardWarningMessage, moderateContent } from '@/lib/content-moderation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function getOrCreateGlobalForum() {
  // First try to get the existing forum
  const { data: existingForum, error: getError } = await supabase
    .from('forum')
    .select('id')
    .eq('forum_name', 'Global Chat')
    .eq('private', false)
    .single();

  if (existingForum) {
    return { data: existingForum, error: null };
  }

  // If forum doesn't exist (PGRST116 = no rows returned), create it
  if (getError && getError.code === 'PGRST116') {
    const { data: newForum, error: createError } = await supabase
      .from('forum')
      .insert({
        forum_name: 'Global Chat',
        forum_description: 'A place for all users and admins to communicate',
        private: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    return { data: newForum, error: createError };
  }

  // Some other error occurred
  return { data: null, error: getError };
}

// GET /api/v1/global-chat - Get recent messages from global forum
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);

    // Get or create the global forum
    const { data: globalForum, error: forumError } = await getOrCreateGlobalForum();

    if (forumError || !globalForum) {
      return new Response(
        JSON.stringify({ error: 'Failed to access global chat forum' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get messages from the global forum with user info
    const { data: messages, error } = await supabase
      .from('forum_chats')
      .select(`
        id,
        message,
        message_warning,
        sent_at,
        sender,
        image_url,
        users!forum_chats_sender_fkey (
          id,
          username,
          role
        ),
        viewers
      `)
      .eq('forum', globalForum.id)
      .not('message', 'is', null) // Only get text messages for now
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Optimize: Batch fetch viewer details to avoid N+1 queries
    const allViewerIds = new Set<string>();
    (messages || []).forEach(msg => {
      if (msg.viewers && Array.isArray(msg.viewers)) {
        msg.viewers.forEach(id => allViewerIds.add(id));
      }
    });

    // Batch fetch all viewer details
    let viewersMap: Record<string, {id: string, username: string, profile_image_link: string | null}> = {};
    if (allViewerIds.size > 0) {
      const { data: viewers, error: viewersError } = await supabase
        .from('users')
        .select('id, username, profile_image_link')
        .in('id', Array.from(allViewerIds));
      
      if (!viewersError && viewers) {
        viewersMap = viewers.reduce((acc, viewer) => {
          acc[viewer.id] = {
            id: viewer.id,
            username: viewer.username || 'Unknown User',
            profile_image_link: viewer.profile_image_link
          };
          return acc;
        }, {} as Record<string, {id: string, username: string, profile_image_link: string | null}>);
      }
    }

    // Process messages using cached viewer details
    const processedMessages = (messages || []).map(msg => {
      const viewerDetails = (msg.viewers || []).map((viewerId: string) => 
        viewersMap[viewerId] || { id: viewerId, username: 'Unknown User', profile_image_link: null }
      );

      return {
        id: msg.id,
        message: msg.message,
        message_warning: msg.message_warning,
        created_at: msg.sent_at,
        user_id: msg.sender,
        viewers: viewerDetails,
        user: msg.users
          ? {
              id: msg.users.id,
              username: msg.users.username,
              role: msg.users.role,
            }
          : null,
      };
    });

    // Reverse to show oldest first for display
    const reversedMessages = processedMessages.reverse();

    return new Response(
      JSON.stringify({
        data: reversedMessages,
        pagination: {
          limit,
          offset,
          hasMore: (messages || []).length === limit,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=3, stale-while-revalidate=5',
          'Vary': 'Accept-Encoding',
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

// POST /api/v1/global-chat - Send a new message to global forum
export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const messageCreateSchema = z
      .object({
        message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
        user_id: z.uuid('Invalid user ID'),
      })
      .strict();

    const parsed = messageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { message, user_id } = parsed.data;

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create the global forum
    const { data: globalForum, error: forumError } = await getOrCreateGlobalForum();

    if (forumError || !globalForum) {
      return new Response(
        JSON.stringify({ error: 'Failed to access global chat forum' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Insert message into forum_chats
    const { data: newMessage, error: insertError } = await supabase
      .from('forum_chats')
      .insert({
        forum: globalForum.id,
        message,
        sender: user_id,
        sent_at: new Date().toISOString(),
      })
      .select(`
        id,
        message,
        sent_at,
        sender,
        users!forum_chats_sender_fkey (
          id,
          username,
          role
        )
      `)
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Do AI moderation asynchronously (don't await to keep response fast)
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      moderateContent(message, GEMINI_API_KEY)
        .then(async (moderation) => {
          if (moderation.isInappropriate && moderation.confidence > 0.5) {
            console.log(`⚠️ AI flagged message ${newMessage.id}:`, {
              confidence: moderation.confidence,
              categories: moderation.categories,
              reason: moderation.reason
            });
            
            // Use the standard warning message
            const warningText = getStandardWarningMessage();
            
            // Try to update the database with the warning
            try {
              // First check if the column exists by attempting the update
              const { error: updateError } = await supabase
                .from('forum_chats')
                .update({ message_warning: warningText })
                .eq('id', newMessage.id);
                
              if (updateError) {
                if (updateError.message.includes('column "message_warning" does not exist')) {
                  console.log('⚠️ message_warning column does not exist yet. Please run: ALTER TABLE forum_chats ADD COLUMN message_warning TEXT;');
                  console.log('For now, logging warning for message:', newMessage.id, warningText);
                } else {
                  console.error('Failed to update message warning:', updateError);
                }
              } else {
                console.log('✅ Successfully added warning to message:', newMessage.id);
              }
            } catch (dbError) {
              console.error('Database update error:', dbError);
            }
          }
        })
        .catch((error) => {
          console.error('AI moderation failed for message:', newMessage.id, error);
        });
    }

    // Send notifications to all users asynchronously (don't await to keep response fast)
    void (async () => {
      try {
        // Get all active users except the sender
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .neq('id', user_id)
          .neq('status', 'INDEFINITE'); // Exclude indefinitely suspended users

        if (usersError || !users) {
          console.error('Error fetching users for global chat notification:', usersError);
          return;
        }

        // Enhanced notifications for admin messages
        const isAdmin = user.role === 1;
        const notificationTitle = `${user.username} - Global Chat`;
        const notificationContent = isAdmin 
          ? `ADMIN: ${message}`
          : message;

        // Send notifications to all users in batches
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          
          // Process batch in parallel
          await Promise.allSettled(
            batch.map(async (targetUser) => {
              try {
                // Send push notification
                await pushNotification(
                  targetUser.id,
                  notificationTitle,
                  notificationContent,
                  `/forum-chat/${globalForum.id}`
                );

                // Store in-app notification
                await storeNotification(
                  targetUser.id,
                  notificationTitle,
                  notificationContent
                );
              } catch (error) {
                console.error(`Failed to notify user ${targetUser.id}:`, error);
              }
            })
          );
        }

        console.log(`Global chat notification sent to ${users.length} users for message from ${user.username}`);
      } catch (error) {
        console.error('Error in global chat notifications:', error);
      }
    })();

    // Format response to match frontend expectations
    const formattedMessage = {
      id: newMessage.id,
      message: newMessage.message,
      created_at: newMessage.sent_at,
      user_id: newMessage.sender,
      user: newMessage.users
        ? {
            id: newMessage.users.id,
            username: newMessage.users.username,
            role: newMessage.users.role,
          }
        : null,
    };

    return new Response(JSON.stringify({ data: formattedMessage }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
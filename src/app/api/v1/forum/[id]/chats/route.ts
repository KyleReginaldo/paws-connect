/* eslint-disable @typescript-eslint/no-explicit-any */
import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// GET /api/v1/forum/[id]/chats - Get all chats for a specific forum
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id'); // Current user for privacy check
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;
    const since = url.searchParams.get('since'); // For real-time updates

    // Check forum exists and get privacy setting
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Check access for private forums
    if (forum.private && userId) {
      // Check if user is the creator or a member
      const isCreator = forum.created_by === userId;

      if (!isCreator) {
        const { data: membership } = await supabase
          .from('forum_members')
          .select('id')
          .eq('forum', forumId)
          .eq('member', userId)
          .single();

        if (!membership) {
          return new Response(JSON.stringify({ error: 'Access denied to private forum' }), {
            status: 403,
          });
        }
      }
    } else if (forum.private && !userId) {
      return new Response(JSON.stringify({ error: 'Authentication required for private forum' }), {
        status: 401,
      });
    }

    // Build optimized query
    let query = supabase
      .from('forum_chats')
      .select(
        `
        id,
        message,
        image_url,
        sent_at,
        sender,
        viewers,
        replied_to(
          id,
          forum,
          sender,
          message,
          sent_at,
          image_url,
          reactions
        ),
        reactions,
        users!forum_chats_sender_fkey (
          id,
          username,
          profile_image_link
        ),
        mentions(
          id,
          user,
          created_at,
          users!mentions_user_fkey(
            id,
            username,
            profile_image_link
          )
        )
      `,
        { count: 'exact' },
      )
      .eq('forum', forumId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add since filter for real-time updates
    if (since) {
      query = query.gt('sent_at', since);
    }

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Process the data to include viewer details and mentions
    const processedData = await Promise.all((data || []).map(async (chat) => {
      let viewerDetails: Array<{id: string, name: string, profile_image: string | null}> = [];
      
      if (chat.viewers && chat.viewers.length > 0) {
        // Fetch viewer details
        const { data: viewers, error: viewersError } = await supabase
          .from('users')
          .select('id, username, profile_image_link')
          .in('id', chat.viewers);
        
        if (!viewersError && viewers) {
          viewerDetails = viewers.map(viewer => ({
            id: viewer.id,
            name: viewer.username || 'Unknown User',
            profile_image: viewer.profile_image_link
          }));
        }
      }

      // Process mentions data
      const mentionedUsers = (chat.mentions || []).map((mention: any) => ({
        id: mention.user,
        name: mention.users?.username || 'Unknown User',
        profile_image: mention.users?.profile_image_link || null,
        mentioned_at: mention.created_at
      }));
      
      return {
        ...chat,
        viewers: viewerDetails,
        mentions: mentionedUsers
      };
    }));

    // Reverse to show oldest first in chat
    const reversedData = processedData?.reverse() || [];

    return new Response(
      JSON.stringify({
        data: reversedData,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
      },
    );
  }
}

// POST /api/v1/forum/[id]/chats - Send a new chat message to a specific forum
export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });

    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const chatCreateSchema = z
      .object({
        message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
        sender: z.uuid('Invalid sender ID'),
        image_url: z.url('Invalid image').max(2048).optional().nullable(),
        replied_to: z.number().optional().nullable(),
        mentions: z.array(z.uuid()).optional().nullable(),
      })
      .strict();

    const parsed = chatCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

  const { message, sender, image_url, replied_to, mentions } = parsed.data;

    // Get forum details and check privacy
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by, forum_name')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Check access for private forums
    if (forum.private) {
      const isCreator = forum.created_by === sender;

      if (!isCreator) {
        const { data: membership } = await supabase
          .from('forum_members')
          .select('id')
          .eq('forum', forumId)
          .eq('member', sender)
          .single();

        if (!membership) {
          return new Response(JSON.stringify({ error: 'Access denied to private forum' }), {
            status: 403,
          });
        }
      }
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', sender)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Insert the chat message with optimized return fields
    const insertObj: Record<string, unknown> = {
      forum: forumId,
      message,
      sender,
      replied_to,
      sent_at: new Date().toISOString(),
      viewers: [sender],
    };
    if (image_url) insertObj.image_url = image_url;

    const { data, error } = await supabase
      .from('forum_chats')
      .insert(insertObj as any)
      .select(
        `
        id,
        message,
        image_url,
        sent_at,
        sender,
        replied_to(
          id,
          forum,
          sender,
          message,
          sent_at,
          viewers,
          image_url,
          reactions
        ),
        users!forum_chats_sender_fkey (
          id,
          username
        )
      `,
      )
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Store mentions in the mentions table if any
    if (mentions && mentions.length > 0) {
      const mentionInserts = mentions.map(userId => ({
        forum_chat: data.id,
        user: userId,
        created_at: new Date().toISOString()
      }));

      const { error: mentionsError } = await supabase
        .from('mentions')
        .insert(mentionInserts);

      if (mentionsError) {
        console.error('Failed to store mentions:', mentionsError);
        // Don't fail the entire request if mentions storage fails
      }
    }

    // Update forum updated_at to reflect latest activity (fire & forget)
    void supabase
      .from('forum')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', forumId);

    // Send notifications to all forum members
    // For replies: original message owner gets special reply notification, others get regular notification
    // For regular messages: everyone gets regular notification
    const { data: forum_members_raw, error: forum_list_error } = await supabase
      .from('forum_members')
      .select('member(id, username), invitation_status, mute')
      .eq('forum', forumId);
    if (forum_list_error || !forum_members_raw) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Get original message owner ID if this is a reply (for special notification handling)
    let originalMessageOwnerId: string | null = null;
    if (replied_to) {
      try {
        const { data: originalMessage } = await supabase
          .from('forum_chats')
          .select('sender')
          .eq('id', replied_to)
          .single();
        originalMessageOwnerId = originalMessage?.sender || null;
      } catch (error) {
        console.error('Failed to get original message owner for notification customization:', error);
      }
    }

    type MemberUser = { id: string; username: string | null };
    type ForumMemberRow = {
      member: MemberUser | null;
      invitation_status: string;
      mute: boolean | null;
    };
    // Normalize shape: some PostgREST responses may nest arrays; ensure single object or null
    const members: ForumMemberRow[] = (forum_members_raw as any[]).map((row) => {
      const m = Array.isArray(row.member) ? row.member[0] : row.member;
      return {
        member: m ? ({ id: m.id, username: m.username } as MemberUser) : null,
        invitation_status: row.invitation_status,
        mute: row.mute,
      } as ForumMemberRow;
    });
    // Send notifications concurrently to reduce latency. We start all notification promises
    // and attach a catch handler to each so rejections are logged but don't cause unhandled
    // promise rejections or delay the HTTP response.
    const notificationPromises: Promise<unknown>[] = [];
    
    // Send mention notifications first (higher priority)
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== sender) {
          // Get mentioned user details
          await supabase
            .from('users')
            .select('username')
            .eq('id', mentionedUserId)
            .single();

          const mentionTitle = `You were mentioned by ${user.username}`;
          const mentionContent = `${user.username} mentioned you in ${forum.forum_name}: ${message}`;

          const mentionPush = pushNotification(
            mentionedUserId,
            mentionTitle,
            mentionContent,
            `/forum-chat/${forumId}`,
            image_url || undefined,
          ).catch((err) => {
            console.error('pushNotification failed for mention', mentionedUserId, err);
            return null;
          });
          notificationPromises.push(mentionPush);

          const mentionStore = storeNotification(
            mentionedUserId,
            mentionTitle,
            mentionContent,
          ).catch((err) => {
            console.error('storeNotification failed for mention', mentionedUserId, err);
            return null;
          });
          notificationPromises.push(mentionStore);
        }
      }
    }

    // Send regular forum notifications to non-mentioned members
    for (const member of members) {
      const recipientId = member.member?.id;
      const isMentioned = recipientId && mentions && mentions.includes(recipientId);
      
      if (recipientId && recipientId !== sender && member.invitation_status === 'APPROVED' && !member.mute && !isMentioned) {
        // Customize notification for original message owner if this is a reply
        const isOriginalMessageOwner = replied_to && recipientId === originalMessageOwnerId;
        
        let notificationTitle: string;
        let notificationContent: string;
        
        if (isOriginalMessageOwner) {
          // Special reply notification for original message owner
          notificationTitle = `${user.username} replied to your message`;
          notificationContent = `${user.username} replied to your message in ${forum.forum_name}: ${message}`;
        } else {
          // Regular forum notification for other members
          notificationTitle = user.username ?? forum.forum_name ?? 'PawsConnect';
          notificationContent = message;
        }

        const p = pushNotification(
          recipientId,
          notificationTitle,
          notificationContent,
          `/forum-chat/${forumId}`,
          image_url || undefined,
        ).catch((err) => {
          // Log the error server-side. In Next.js route handlers we don't have a logger here,
          // so attach to console.error for now.
          console.error('pushNotification failed for member', recipientId, err);
          // swallow error to avoid unhandled rejection
          return null;
        });
          notificationPromises.push(p);

          const q = storeNotification(
            recipientId,
            notificationTitle,
            notificationContent,
          ).catch((err) => {
          console.error('storeNotification failed for member', recipientId, err);
            return null;
          });
          notificationPromises.push(q);
      }
    }

    // Fire-and-forget: don't await Promise.all to avoid delaying response. Optionally we
    // could await Promise.allSettled(notificationPromises) with a short timeout if reliability
    // is desired, but for low latency return immediately while notifications continue.
    void Promise.allSettled(notificationPromises).then((results) => {
      // Optional: log aggregated results if needed
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        console.warn(`Some push notifications failed for forum ${forumId}:`, failed.length);
      }
    });
    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
      },
    );
  }
}

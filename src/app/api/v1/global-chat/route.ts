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

// GET /api/v1/global-chat - Get recent messages from global forum
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);

    // First get the global forum ID
    const { data: globalForum, error: forumError } = await supabase
      .from('forum')
      .select('id')
      .eq('forum_name', 'Global Chat')
      .eq('private', false)
      .single();

    if (forumError || !globalForum) {
      return new Response(
        JSON.stringify({ error: 'Global chat forum not found. Please contact administrator.' }),
        {
          status: 404,
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
        sent_at,
        sender,
        image_url,
        users!forum_chats_sender_fkey (
          id,
          username,
          role
        )
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

    // Reverse to show oldest first for display, and format for frontend
    const reversedMessages = (messages || []).reverse().map((msg) => ({
      id: msg.id,
      message: msg.message,
      created_at: msg.sent_at,
      user_id: msg.sender,
      user: msg.users
        ? {
            id: msg.users.id,
            username: msg.users.username,
            role: msg.users.role,
          }
        : null,
    }));

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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
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

    // Get the global forum ID
    const { data: globalForum, error: forumError } = await supabase
      .from('forum')
      .select('id')
      .eq('forum_name', 'Global Chat')
      .eq('private', false)
      .single();

    if (forumError || !globalForum) {
      return new Response(
        JSON.stringify({ error: 'Global chat forum not found. Please contact administrator.' }),
        {
          status: 404,
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
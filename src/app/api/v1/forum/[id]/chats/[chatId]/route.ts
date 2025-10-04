/* eslint-disable @typescript-eslint/no-explicit-any */
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

// GET /api/v1/forum/[id]/chats/[chatId] - Get a specific chat message
export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);

    if (Number.isNaN(forumId) || Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('forum_chats')
      .select(
        `
        id,
        message,
        sent_at,
        sender,
        users!forum_chats_sender_fkey (
          id,
          username
        )
      `,
      )
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
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

// PUT /api/v1/forum/[id]/chats/[chatId] - Update a specific chat message
export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);

    if (Number.isNaN(forumId) || Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }

    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const chatUpdateSchema = z
      .object({
        message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
        sender: z.string().uuid('Invalid sender ID'),
      })
      .strict();

    const parsed = chatUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { message, sender } = parsed.data;

    // Optimized: Get existing chat and verify ownership in one query
    const { data: existingChat, error: existingChatError } = await supabase
      .from('forum_chats')
      .select('sender')
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (existingChatError || !existingChat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Verify ownership
    if (existingChat.sender !== sender) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only edit your own messages' }),
        { status: 403 },
      );
    }

    // Update with optimized return fields
    const { data, error } = await supabase
      .from('forum_chats')
      .update({ message })
      .eq('id', chatId)
      .eq('forum', forumId)
      .select(
        `
        id,
        message,
        sent_at,
        sender,
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

    return new Response(JSON.stringify({ data }), {
      status: 200,
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

// DELETE /api/v1/forum/[id]/chats/[chatId] - Delete a specific chat message
export async function DELETE(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);

    if (Number.isNaN(forumId) || Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }

    // Get sender ID from request body or query params for authorization
    const body = await parseJson(request);
    const url = new URL(request.url);
    const senderId = body?.sender || url.searchParams.get('sender');

    if (!senderId) {
      return new Response(JSON.stringify({ error: 'Sender ID is required' }), { status: 400 });
    }

    // Optimized: Single query to verify ownership and delete
    const { data: existingChat, error: existingChatError } = await supabase
      .from('forum_chats')
      .select('sender')
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (existingChatError || !existingChat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Verify ownership
    if (existingChat.sender !== senderId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only delete your own messages' }),
        { status: 403 },
      );
    }

    // Delete the chat message
    const { data, error } = await supabase
      .from('forum_chats')
      .delete()
      .eq('id', chatId)
      .eq('forum', forumId)
      .select('id')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Chat message deleted successfully' }), {
      status: 200,
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

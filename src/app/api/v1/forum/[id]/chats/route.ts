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

// GET /api/v1/forum/[id]/chats - Get all chats for a specific forum
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;
    const since = url.searchParams.get('since'); // For real-time updates

    // Build optimized query
    let query = supabase
      .from('forum_chats')
      .select(`
        id,
        message,
        sent_at,
        sender,
        users!forum_chats_sender_fkey (
          id,
          username
        )
      `, { count: 'exact' })
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

    // Reverse to show oldest first in chat
    const reversedData = data?.reverse() || [];

    return new Response(JSON.stringify({ 
      data: reversedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
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
        sender: z.string().uuid('Invalid sender ID'),
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

    const { message, sender } = parsed.data;

    // Single query to validate both forum and user existence (faster than sequential queries)
    const [forumCheck, userCheck] = await Promise.all([
      supabase.from('forum').select('id').eq('id', forumId).single(),
      supabase.from('users').select('id').eq('id', sender).single()
    ]);

    if (forumCheck.error || !forumCheck.data) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    if (userCheck.error || !userCheck.data) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Insert the chat message with optimized return fields
    const { data, error } = await supabase
      .from('forum_chats')
      .insert({
        forum: forumId,
        message,
        sender,
        sent_at: new Date().toISOString(),
      })
      .select(`
        id,
        message,
        sent_at,
        sender,
        users!forum_chats_sender_fkey (
          id,
          username
        )
      `)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

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

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
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    // First, verify that the forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Get chats for the forum with user information
    const { data, error, count } = await supabase
      .from('forum_chats')
      .select(`
        *,
        users!forum_chats_sender_fkey (
          id,
          username,
          email
        )
      `, { count: 'exact' })
      .eq('forum', forumId)
      .order('sent_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }), {
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

    // First, verify that the forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Verify that the sender exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', sender)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Insert the chat message
    const { data, error } = await supabase
      .from('forum_chats')
      .insert({
        forum: forumId,
        message,
        sender,
        sent_at: new Date().toISOString(),
      })
      .select(`
        *,
        users!forum_chats_sender_fkey (
          id,
          username,
          email
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

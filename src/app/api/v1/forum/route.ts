import { supabase } from '@/app/supabase/supabase';
import { fetchForumsWithMembers } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const createdBy = url.searchParams.get('created_by');
    const userId = url.searchParams.get('user_id'); // Current user to check private forum access
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));

    // Use the utility function (now includes last_chat and orders by latest activity)
    const { data: forumsWithMemberInfo, count } = await fetchForumsWithMembers({
      page,
      limit,
      createdBy: createdBy || undefined,
      userId: userId || undefined,
      useCache: false,
    });

    return new Response(
      JSON.stringify({
        data: forumsWithMemberInfo,
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

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const forumCreateSchema = z
      .object({
        forum_name: z.string().min(1, 'Forum name is required').max(100, 'Forum name too long'),
        created_by: z.uuid('Invalid user ID'),
        private: z.boolean().optional(),
      })
      .strict();

    const parsed = forumCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const now = new Date().toISOString();
    const row = {
      ...parsed.data,
      created_at: now,
      updated_at: now,
    };

    // Optimized insert with selective return fields
    const { data, error } = await supabase
      .from('forum')
      .insert(row)
      .select(
        `
        id,
        forum_name,
        created_at,
        updated_at,
        created_by,
        private,
        users!forum_created_by_fkey (
          id,
          username
        )
      `,
      )
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add the creator as an initial forum member with APPROVED status
    const { error: memberError } = await supabase
      .from('forum_members')
      .insert({
        forum: data.id,
        member: parsed.data.created_by,
        invitation_status: 'APPROVED',
        created_at: now,
      });

    if (memberError) {
      // If adding the creator as member fails, we should probably rollback the forum creation
      // But for now, we'll just log the error and continue
      console.error('Failed to add creator as forum member:', memberError);
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
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

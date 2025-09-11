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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const createdBy = url.searchParams.get('created_by');
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;

    // Optimized query with selective fields and pagination
    let query = supabase
      .from('forum')
      .select(`
        id,
        forum_name,
        created_at,
        updated_at,
        created_by,
        users!forum_created_by_fkey (
          id,
          username
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data, error, count } = await query;
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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
        created_by: z.string().uuid('Invalid user ID'),
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
      updated_at: now
    };

    // Optimized insert with selective return fields
    const { data, error } = await supabase
      .from('forum')
      .insert(row)
      .select(`
        id,
        forum_name,
        created_at,
        updated_at,
        created_by,
        users!forum_created_by_fkey (
          id,
          username
        )
      `)
      .single();
      
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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
        headers: { 'Content-Type': 'application/json' }
      },
    );
  }
}

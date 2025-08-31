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
    const idParam = request.nextUrl.searchParams.get('id');

    if (idParam) {
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
      }

      const { data, error } = await supabase.from('address').select('*').eq('id', id).single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.from('address').select('*');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const addressCreateSchema = z
      .object({
        city: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        is_default: z.boolean().nullable().optional(),
        state: z.string().nullable().optional(),
        street: z.string().nullable().optional(),
        users: z.string().nullable().optional(),
        zip_code: z.string().nullable().optional(),
      })
      .strict();

    const parsed = addressCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const row = { ...parsed.data };

    const { data, error } = await supabase.from('address').insert(row).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

// Using PUT (replace) instead of PATCH as requested
export async function PUT(request: NextRequest) {
  try {
    const idParam = request.nextUrl.searchParams.get('id');
    if (!idParam)
      return new Response(JSON.stringify({ error: 'Missing id query param' }), { status: 400 });

    const id = Number(idParam);
    if (Number.isNaN(id))
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const { data, error } = await supabase
      .from('address')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const idParam = request.nextUrl.searchParams.get('id');
    if (!idParam)
      return new Response(JSON.stringify({ error: 'Missing id query param' }), { status: 400 });

    const id = Number(idParam);
    if (Number.isNaN(id))
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

    const { data, error } = await supabase.from('address').delete().eq('id', id).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

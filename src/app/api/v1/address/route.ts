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
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
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

    // Auto-set first address as default: check if user has any existing addresses
    let isFirstForUser = false;
    if (row.users && row.users.trim()) {
      console.log(`Checking existing addresses for user: ${row.users}`);
      try {
        const { count, error: countErr } = await supabase
          .from('address')
          .select('*', { count: 'exact', head: true })
          .eq('users', row.users);

        if (countErr) {
          console.warn('Error checking existing addresses:', countErr.message);
        } else {
          const hasExisting = count && count > 0;
          console.log(`User ${row.users} has ${count || 0} existing addresses`);

          if (!hasExisting) {
            console.log('This is the first address for user, setting is_default to true');
            row.is_default = true;
            isFirstForUser = true;
          } else {
            console.log('User already has addresses, keeping provided is_default value or false');
            // If not explicitly set to true, ensure it's false when user has other addresses
            if (row.is_default !== true) {
              row.is_default = false;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to check existing addresses, proceeding with provided payload', e);
      }
    } else {
      console.log('No user ID provided, skipping auto-default logic');
    }

    console.log('Address insert row (pre-insert):', row);

    const { data, error } = await supabase.from('address').insert(row).select().single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    let finalData = data;

    // If we expected this to be the first address but the inserted row does not have is_default=true,
    // enforce it explicitly (covering cases where DB defaults/constraints may override the provided value).
    if (isFirstForUser && data && data.is_default !== true) {
      try {
        const { data: updated, error: updErr } = await supabase
          .from('address')
          .update({ is_default: true })
          .eq('id', data.id)
          .select()
          .single();
        if (updErr) {
          console.warn('Failed to force-default address after insert:', updErr.message);
        } else {
          console.log('Enforced is_default on inserted address:', updated);
          finalData = updated; // Use the updated data with is_default: true
        }
      } catch (uErr) {
        console.warn('Error enforcing is_default after insert:', uErr);
      }
    }

    console.log('Final address data being returned:', finalData);

    return new Response(JSON.stringify({ data: finalData }), {
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

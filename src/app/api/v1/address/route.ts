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

    // Determine default behavior: if first address -> default; if new default requested -> demote previous default(s)
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
          const hasExisting = !!count && count > 0;
          console.log(`User ${row.users} has ${count || 0} existing addresses`);
          if (!hasExisting) {
            // First address is always default regardless of provided flag
            row.is_default = true;
            isFirstForUser = true;
            console.log('First address: setting is_default = true');
          } else {
            if (row.is_default === true) {
              // User requests a new default: demote all existing defaults
              console.log('New default requested; demoting existing default addresses');
              try {
                const { error: demoteErr } = await supabase
                  .from('address')
                  .update({ is_default: false })
                  .eq('users', row.users)
                  .eq('is_default', true);
                if (demoteErr) {
                  console.warn('Failed to demote existing default addresses:', demoteErr.message);
                }
              } catch (demoteCatch) {
                console.warn('Unexpected error demoting existing defaults:', demoteCatch);
              }
              // Keep row.is_default = true for insertion
            } else {
              // Not explicitly default; ensure false
              row.is_default = false;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to check existing addresses; continuing without default demotion logic', e);
        // If we cannot verify existing addresses and user requested default, proceed; DB constraints should handle conflicts if any.
      }
    } else {
      console.log('No user ID provided; skipping default logic');
    }

    console.log('Address insert row (pre-insert):', row);

    const { data, error } = await supabase.from('address').insert(row).select().single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    let finalData = data;

    // Post-insert enforcement only needed for first address edge case
    if (isFirstForUser && finalData && finalData.is_default !== true) {
      try {
        const { data: updated, error: updErr } = await supabase
          .from('address')
          .update({ is_default: true })
          .eq('id', finalData.id)
          .select()
          .single();
        if (!updErr && updated) {
          finalData = updated;
        } else if (updErr) {
          console.warn('Failed enforcing default on first address after insert:', updErr.message);
        }
      } catch (enfErr) {
        console.warn('Unexpected error enforcing first address default:', enfErr);
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

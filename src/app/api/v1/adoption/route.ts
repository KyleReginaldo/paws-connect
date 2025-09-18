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
    const userParam = request.nextUrl.searchParams.get('user');

    if (userParam) {
      const { data, error } = await supabase.from('adoption').select('*').eq('user', userParam);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.from('adoption').select('*');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    console.log('data: ',data);
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

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const adoptionCreateSchema = z
      .object({
        created_at: z.string().optional(),
        has_children_in_home: z.boolean().nullable().optional(),
        has_other_pets_in_home: z.boolean().nullable().optional(),
        have_outdoor_space: z.boolean().nullable().optional(),
        have_permission_from_landlord: z.boolean().nullable().optional(),
        id: z.number().int().optional(),
        is_renting: z.boolean().nullable().optional(),
        number_of_household_members: z.number().nullable().optional(),
        pet: z.number().nullable().optional(),
        type_of_residence: z.string().nullable().optional(),
        user: z.string().nullable().optional(),
      })
      .strict();

    const parsed = adoptionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const row = { ...parsed.data, created_at: parsed.data.created_at ?? new Date().toISOString() };

    const { data, error } = await supabase.from('adoption').insert(row).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

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

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

export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId))
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

    const { data, error } = await supabase.from('adoption').select('*').eq('id', pathId).single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

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

export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId))
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const adoptionUpdateSchema = z
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

    const parsed = adoptionUpdateSchema.safeParse(body);
    type AdoptionUpdate = z.infer<typeof adoptionUpdateSchema>;
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const validated: AdoptionUpdate = parsed.data;
    if (validated.id !== undefined && validated.id !== pathId) {
      return new Response(JSON.stringify({ error: 'ID mismatch between path and payload' }), {
        status: 400,
      });
    }

    const { id: payloadId, ...updatePayload } = validated;
    void payloadId;

    const { data, error } = await supabase
      .from('adoption')
      .update(updatePayload)
      .eq('id', pathId)
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
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId))
      return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

    const { data, error } = await supabase
      .from('adoption')
      .delete()
      .eq('id', pathId)
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
      {
        status: 500,
      },
    );
  }
}

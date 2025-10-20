import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Cancel an adoption for a given user and pet.
 * Preferred behavior: set status = 'CANCELLED' when the row exists.
 * Fallback (if no status column): delete the row.
 *
 * Request: POST /api/v1/adoption/cancel
 * Body JSON: { user: string (uuid), pet: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const schema = z
      .object({
        user: z.uuid('Invalid user id'),
        pet: z.number().int('Invalid pet id'),
      })
      .strict();

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { user, pet } = parsed.data;

    // Look up adoption row for this user+pet
    const { data: adoptionRow, error: fetchErr } = await supabase
      .from('adoption')
      .select('id, status')
      .eq('user', user)
      .eq('pet', pet)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to check adoption', message: fetchErr.message }),
        { status: 500 },
      );
    }

    if (!adoptionRow) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'No adoption for this user and pet' }),
        { status: 404 },
      );
    }

    // Try to set status to CANCELLED first
    const { data: updated, error: updateErr } = await supabase
      .from('adoption')
      .delete()
      .eq('id', adoptionRow.id)
      .select()
      .maybeSingle();

    if (!updateErr && updated) {
      return new Response(
        JSON.stringify({ message: 'Adoption cancelled', data: updated }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // If updating the status failed (e.g., no status column), fallback to delete
    const { data: deleted, error: deleteErr } = await supabase
      .from('adoption')
      .delete()
      .eq('id', adoptionRow.id)
      .select()
      .maybeSingle();

    if (deleteErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to cancel adoption', message: deleteErr.message }),
        { status: 500 },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Adoption cancelled (deleted)', data: deleted }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

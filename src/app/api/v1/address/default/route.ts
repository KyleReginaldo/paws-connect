import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId)
      return new Response(JSON.stringify({ error: 'Missing userId param' }), { status: 400 });

    const { data, error } = await supabase
      .from('address')
      .select('*')
      .eq('users', userId)
      .eq('is_default', true)
      .limit(1)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const { addressId, userId } = body as { addressId?: number; userId?: string };
    if (!addressId || !userId)
      return new Response(JSON.stringify({ error: 'Missing addressId or userId' }), {
        status: 400,
      });

    // Unset previous default for this user
    const { error: unsetErr } = await supabase
      .from('address')
      .update({ is_default: false })
      .eq('users', userId)
      .eq('is_default', true);
    if (unsetErr) {
      console.warn('Failed to unset previous default address:', unsetErr.message);
    }

    // Set the requested address as default
    const { data, error } = await supabase
      .from('address')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('users', userId)
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

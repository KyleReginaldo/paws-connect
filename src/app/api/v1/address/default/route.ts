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

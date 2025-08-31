import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const userId = (params as { userId: string }).userId;
    if (!userId)
      return new Response(JSON.stringify({ error: 'Missing userId param' }), { status: 400 });

    const { data, error } = await supabase.from('adoption').select('*').eq('user', userId);
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

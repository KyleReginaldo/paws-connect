import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = ((await params) as any).userId;
    if (!userId)
      return new Response(JSON.stringify({ error: 'Missing userId param' }), { status: 400 });

    const { data, error } = await supabase.from('forum').select('*').eq('created_by', userId);
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

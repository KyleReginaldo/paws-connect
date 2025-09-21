import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const limitParam = request.nextUrl.searchParams.get('limit');
    const offsetParam = request.nextUrl.searchParams.get('offset');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User id is required' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id, created_at, pet:pets(*)')
      .eq('user', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch user favorites', error.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch favorites', message: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Favorites user GET error', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }), {
      status: 500,
    });
  }
}

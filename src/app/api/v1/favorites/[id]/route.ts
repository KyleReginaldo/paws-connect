import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const favoriteId = parseInt(id, 10);
    if (isNaN(favoriteId)) {
      return new Response(JSON.stringify({ error: 'Invalid favorite ID' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id, created_at, user:users(id, username, email), pet:pets(*)')
      .eq('id', favoriteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Favorite not found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch favorite', message: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Favorites/[id] GET error', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }), {
      status: 500,
    });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const favoriteId = parseInt(id, 10);
    if (isNaN(favoriteId)) {
      return new Response(JSON.stringify({ error: 'Invalid favorite ID' }), { status: 400 });
    }

    const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Favorite not found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ error: 'Failed to delete favorite', message: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Favorite deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Favorites/[id] DELETE error', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }), {
      status: 500,
    });
  }
}

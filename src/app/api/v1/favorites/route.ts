import { supabase } from '@/app/supabase/supabase';
import { createFavoriteSchema, getFavoritesQuerySchema } from '@/config/schema/favoriteSchema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = getFavoritesQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid query parameters', issues: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { limit, offset } = parsed.data;

    const { data, error } = await supabase
      .from('favorites')
      .select('id, created_at, user:users(id, username, email), pet:pets(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch favorites', error.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch favorites', message: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Favorites GET error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createFavoriteSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request data', issues: result.error.issues }), {
        status: 400,
      });
    }

    const { user, pet } = result.data;

    // Verify pet exists
    const { data: petData, error: petError } = await supabase.from('pets').select('id').eq('id', pet).single();
    if (petError || !petData) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), { status: 404 });
    }

    // Prevent duplicate favorite
    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user', user)
      .eq('pet', pet);

    if (existingError) {
      console.error('Failed to check existing favorite', existingError.message);
      return new Response(JSON.stringify({ error: 'Failed to create favorite', message: existingError.message }), {
        status: 500,
      });
    }

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Favorite already exists' }), { status: 409 });
    }

    const { data, error } = await supabase.from('favorites').insert({ user, pet }).select().single();

    if (error) {
      console.error('Failed to insert favorite', error.message);
      return new Response(JSON.stringify({ error: 'Failed to create favorite', message: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Favorite created successfully', data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Favorites POST error', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

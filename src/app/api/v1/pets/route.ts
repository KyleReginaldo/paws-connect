import { supabase } from '@/app/supabase/supabase';
import { createPetSchema } from '@/config/schema/petSchema';

export async function GET() {
  const { data, error } = await supabase
    .from('pets')
    .select('*, photo')
    .order('created_at', { ascending: false });
  if (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch pets',
        message: error.message,
      }),
      { status: 404 },
    );
  }
  return new Response(
    JSON.stringify({
      message: 'Success',
      data: data,
    }),
    {
      status: 200,
    },
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createPetSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Bad Request', message: result.error.message }), {
      status: 400,
    });
  }
  const {
    added_by,
    age,
    breed,
    date_of_birth,
    description,
    gender,
    good_with,
    health_status,
    is_spayed_or_neutured,
    is_trained,
    is_vaccinated,
    name,
    rescue_address,
    size,
    special_needs,
    type,
    weight,
    request_status,
    photo,
  } = result.data;
  const { data, error } = await supabase
    .from('pets')
    .insert({
      added_by,
      age,
      breed,
      date_of_birth,
      description,
      gender,
      good_with,
      health_status,
      is_spayed_or_neutured,
      is_trained,
      is_vaccinated,
      name,
      rescue_address,
      size,
      special_needs,
      type,
      weight,
      request_status: request_status || 'pending',
      photo,
    })
    .select()
    .single();
  if (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to create pet',
        message: error.message,
      }),
      { status: 400 },
    );
  }
  return new Response(
    JSON.stringify({
      message: 'Pet created successfully',
      data: data,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

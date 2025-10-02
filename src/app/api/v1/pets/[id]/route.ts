import { supabase } from '@/app/supabase/supabase';
import { updatePetSchema } from '@/config/schema/petSchema';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const { error } = await supabase.from('pets').delete().eq('id', id);
  console.log(req.url);

  if (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to delete pet',
        message: error.message,
      }),
      { status: 400 },
    );
  }
  return new Response(
    JSON.stringify({
      message: 'Pet deleted successfully',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = updatePetSchema.safeParse(body);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        message: result.error.issues,
      }),
      { status: 400 },
    );
  }

  const {
    name,
    type,
    breed,
    gender,
    age,
    date_of_birth,
    size,
    weight,
    is_vaccinated,
    is_spayed_or_neutured,
    health_status,
    good_with,
    is_trained,
    rescue_address,
    description,
    special_needs,
    request_status,
    photo,
  } = result.data;
  const { data: updatedPet, error } = await supabase
    .from('pets')
    .update({
      name,
      type,
      breed,
      gender,
      age,
      date_of_birth,
      size,
      weight,
      is_vaccinated,
      is_spayed_or_neutured,
      health_status,
      good_with,
      is_trained,
      rescue_address,
      description,
      special_needs,
      request_status,
      photo,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to update pet',
        message: error.message,
      }),
      { status: 400 },
    );
  }
  return new Response(
    JSON.stringify({
      message: 'Pet updated successfully',
      data: updatedPet,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validate id is a number
  const petId = Number(id);
  if (Number.isNaN(petId) || petId <= 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid pet id', message: 'id must be a positive integer' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { data: pet, error } = await supabase.from('pets').select('*, adoption(*, users(*))').eq('id', petId).single();
    if (error) {
      // If Supabase returns a specific not found message use 404, otherwise 400
      if (error.code === 'PGRST116' || /not found/i.test(error.message || '')) {
        return new Response(
          JSON.stringify({ error: 'Not found', message: 'Pet not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pet', message: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Not found', message: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If caller provided ?user=<userId> we compute isFavorite for this pet
    try {
      const url = new URL(_req.url);
      const user = url.searchParams.get('user');
      if (user) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('id')
          .eq('user', user)
          .eq('pet', petId)
          .limit(1);
        const isFavorite = Array.isArray(favs) && favs.length > 0;
        const adopted = Array.isArray(pet.adoption) ? pet.adoption.some((adoption: { status: string | null }) => adoption.status === 'APPROVED') : false;
        return new Response(JSON.stringify({ data: { ...pet, adopted, isFavorite, is_favorite: isFavorite } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Failed to compute pet favorite status', e);
    }

    const adopted = Array.isArray(pet.adoption) ? pet.adoption.some((adoption: { status: string | null }) => adoption.status === 'APPROVED') : false;
    return new Response(JSON.stringify({ data: { ...pet, adopted } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('GET /api/v1/pets/[id] error', e);
    return new Response(
      JSON.stringify({ error: 'Server error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

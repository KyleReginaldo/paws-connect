import { supabase } from '@/app/supabase/supabase';
import { updatePetSchema } from '@/config/schema/petSchema';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const { error } = await supabase.from('pets').delete().eq('id', id);
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

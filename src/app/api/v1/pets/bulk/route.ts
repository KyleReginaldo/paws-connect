import { supabase } from '@/app/supabase/supabase';
import { createPetSchema, type CreatePetDto } from '@/config/schema/petSchema';

export async function POST(request: Request) {
  console.log('Bulk import request received');

  const body = await request.json().catch(() => null);
  if (!body) {
    console.error('Invalid JSON in request body');
    return new Response(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }), {
      status: 400,
    });
  }

  // Accept either an array or { pets: [...] }
  const petsInput = Array.isArray(body) ? body : body.pets;
  if (!Array.isArray(petsInput)) {
    console.error('Expected pets array, got:', typeof petsInput);
    return new Response(JSON.stringify({ error: 'Bad Request', message: 'Expected pets array' }), {
      status: 400,
    });
  }

  console.log(`Processing ${petsInput.length} pets for bulk import`);

  const validPets: CreatePetDto[] = [];
  const errors: { index: number; message: string; data?: unknown }[] = [];

  (petsInput as unknown[]).forEach((p: unknown, idx: number) => {
    console.log(`Validating pet ${idx}:`, p);
    const result = createPetSchema.safeParse(p);
    if (!result.success) {
      const errorMsg = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      console.error(`Pet ${idx} validation failed:`, errorMsg);
      errors.push({ index: idx, message: errorMsg, data: p });
    } else {
      console.log(`Pet ${idx} validation passed`);
      validPets.push(result.data);
    }
  });

  console.log(`${validPets.length} valid pets, ${errors.length} errors`);

  if (validPets.length === 0) {
    console.error('No valid pets to import');
    return new Response(
      JSON.stringify({ message: 'No valid pets to import', created: 0, errors }),
      { status: 400 },
    );
  }

  console.log('Inserting valid pets into database...');
  const { data, error } = await supabase.from('pets').insert(validPets).select();
  if (error) {
    console.error('Database insert failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to insert pets', message: error.message }),
      { status: 500 },
    );
  }

  console.log(`Successfully inserted ${data?.length || 0} pets`);
  return new Response(
    JSON.stringify({ message: 'Import completed', created: data?.length || 0, data, errors }),
    { status: 201 },
  );
}

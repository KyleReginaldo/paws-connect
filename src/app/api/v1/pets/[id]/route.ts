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
  console.log('=== PET UPDATE START ===');
  console.log('📝 Updating pet ID:', id);

  const contentType = req.headers.get('content-type');
  const isMultipart = contentType?.includes('multipart/form-data');
  
  let petUpdateData: {
    name?: string;
    type?: string;
    breed?: string;
    gender?: string;
    age?: number;
    date_of_birth?: string;
    size?: string;
    weight?: string;
    is_vaccinated?: boolean;
    is_spayed_or_neutured?: boolean;
    health_status?: string;
    good_with?: string[];
    is_trained?: boolean;
    rescue_address?: string;
    description?: string;
    special_needs?: string;
    request_status?: string;
    photos?: string[];
    color?: string;
  };

  if (isMultipart) {
    console.log('📤 Processing multipart/form-data request');
    const fd = await req.formData();
    
    // Get existing photos that should be preserved
    const existingPhotos = fd.getAll('existing_photos') as string[];
    console.log(`📷 Preserving ${existingPhotos.length} existing photos`);
    
    // Process new photo files
    const photoFiles = fd.getAll('photos') as File[];
    const newPhotoUrls: string[] = [];
    
    console.log(`📁 Processing ${photoFiles.length} new photo files`);
    for (const file of photoFiles) {
      if (file && file.size > 0) {
        console.log(`⬆️ Uploading photo: ${file.name}, size: ${file.size} bytes`);
        
        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return new Response(
            JSON.stringify({
              error: 'File too large',
              message: `Photo "${file.name}" exceeds 5MB limit`,
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({
              error: 'Invalid file type',
              message: `File "${file.name}" must be JPEG, PNG, or WebP`,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        // Upload to Supabase storage
        const fileName = `pets/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
          });
        
        if (uploadError) {
          console.error(`❌ Upload failed for ${file.name}:`, uploadError);
          return new Response(
            JSON.stringify({
              error: 'Upload failed',
              message: `Failed to upload photo "${file.name}": ${uploadError.message}`,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(uploadData.path);
        
        newPhotoUrls.push(urlData.publicUrl);
        console.log(`✅ Photo uploaded successfully: ${urlData.publicUrl}`);
      }
    }
    
    // Combine existing photos with new uploads
    const allPhotos = [...existingPhotos, ...newPhotoUrls];
    console.log(`📷 Final photo list: ${existingPhotos.length} existing + ${newPhotoUrls.length} new = ${allPhotos.length} total`);
    
    // Parse good_with array
    const goodWithRaw = fd.getAll('good_with[]') as string[];
    
    // Build pet data from FormData
    petUpdateData = {
      name: fd.get('name') as string,
      type: fd.get('type') as string,
      breed: fd.get('breed') as string,
      gender: fd.get('gender') as string,
      age: parseInt(fd.get('age') as string) || undefined,
      date_of_birth: fd.get('date_of_birth') as string,
      size: fd.get('size') as string,
      weight: fd.get('weight') as string,
      is_vaccinated: fd.get('is_vaccinated') === 'true',
      is_spayed_or_neutured: fd.get('is_spayed_or_neutured') === 'true',
      health_status: fd.get('health_status') as string,
      good_with: goodWithRaw,
      is_trained: fd.get('is_trained') === 'true',
      rescue_address: fd.get('rescue_address') as string,
      description: fd.get('description') as string,
      special_needs: fd.get('special_needs') as string,
      request_status: fd.get('request_status') as string,
      photos: allPhotos.length > 0 ? allPhotos : undefined,
      color: fd.get('color') as string,
    };
    
    // Remove undefined values
    const cleanedData: Record<string, string | number | boolean | string[]> = {};
    Object.entries(petUpdateData).forEach(([key, value]) => {
      if (value !== undefined && value !== 'undefined') {
        cleanedData[key] = value;
      }
    });
    petUpdateData = cleanedData;
    
  } else {
    console.log('📝 Processing JSON request');
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

    petUpdateData = result.data;
  }

  console.log('📝 Processed pet data:', {
    ...petUpdateData,
    photos: petUpdateData.photos ? `${petUpdateData.photos.length} photo(s)` : 'no photos',
  });
  console.log('💾 Updating database with processed pet data...');
  const { data: updatedPet, error } = await supabase
    .from('pets')
    .update(petUpdateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.log('❌ Database update error:', error.message);
    return new Response(
      JSON.stringify({
        error: 'Failed to update pet',
        message: error.message,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  
  console.log('✅ Successfully updated pet:', updatedPet.id);
  console.log('📷 Pet photos updated:', updatedPet.photos?.length || 0);
  console.log('=== PET UPDATE END ===');
  
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
    const { data: pet, error } = await supabase.from('pets').select('*, adoption(*, happiness_image, user:users(*))').eq('id', petId).single();
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
        const approvedAdoption = Array.isArray(pet.adoption) ? pet.adoption.find((adoption: { status: string | null; happiness_image: string | null; id: number }) => adoption.status === 'APPROVED') : null;
        const adopted = approvedAdoption ? {
          id: approvedAdoption.id,
          status: approvedAdoption.status || 'APPROVED',
          happiness_image: approvedAdoption.happiness_image
        } : null;
        return new Response(JSON.stringify({ data: { ...pet, adopted, isFavorite, is_favorite: isFavorite } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Failed to compute pet favorite status', e);
    }

    const approvedAdoption = Array.isArray(pet.adoption) ? pet.adoption.find((adoption: { status: string | null; happiness_image: string | null; id: number }) => adoption.status === 'APPROVED') : null;
    const adopted = approvedAdoption ? {
      id: approvedAdoption.id,
      status: approvedAdoption.status || 'APPROVED',
      happiness_image: approvedAdoption.happiness_image
    } : null;
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

import { supabase } from '@/app/supabase/supabase';
import { createPetSchema } from '@/config/schema/petSchema';
import { Pet } from '@/config/types/pet';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Extract query parame      request_status: request_status || 'pending',\n      photos,rs for filtering
  const type = searchParams.get('type');
  const breed = searchParams.get('breed');
  const gender = searchParams.get('gender');
  const size = searchParams.get('size');
  const age_min = searchParams.get('age_min');
  const age_max = searchParams.get('age_max');
  const is_vaccinated = searchParams.get('is_vaccinated');
  const is_spayed_or_neutured = searchParams.get('is_spayed_or_neutured');
  const is_trained = searchParams.get('is_trained');
  const health_status = searchParams.get('health_status');
  const request_status = searchParams.get('request_status');
  const good_with = searchParams.get('good_with');
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  // Optional user id to compute whether each pet is favorited by this user
  const user = searchParams.get('user');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const DEFAULT_LIMIT = 50;

  try {
  // Start building the query
  // Use an estimated count by default to avoid the expensive exact count on large tables
  let query = supabase.from('pets').select('*, photos, adoption(id, status, happiness_image, created_at, user:users(*))', { count: 'estimated' });

    // Apply filters based on query parameters
    if (type) {
      query = query.ilike('type', `%${type}%`);
    }

    if (breed) {
      query = query.ilike('breed', `%${breed}%`);
    }

    if (gender) {
      query = query.ilike('gender', `%${gender}%`);
    }

    if (size) {
      query = query.ilike('size', `%${size}%`);
    }

    if (age_min) {
      const minAge = parseInt(age_min);
      if (!isNaN(minAge)) {
        query = query.gte('age', minAge);
      }
    }

    if (age_max) {
      const maxAge = parseInt(age_max);
      if (!isNaN(maxAge)) {
        query = query.lte('age', maxAge);
      }
    }

    if (is_vaccinated) {
      const vaccinated = is_vaccinated.toLowerCase() === 'true';
      query = query.eq('is_vaccinated', vaccinated);
    }

    if (is_spayed_or_neutured) {
      const spayed = is_spayed_or_neutured.toLowerCase() === 'true';
      query = query.eq('is_spayed_or_neutured', spayed);
    }

    if (is_trained) {
      const trained = is_trained.toLowerCase() === 'true';
      query = query.eq('is_trained', trained);
    }

    if (health_status) {
      query = query.ilike('health_status', `%${health_status}%`);
    }

    if (request_status) {
      query = query.eq('request_status', request_status);
    }

    if (good_with) {
      // Support searching for pets good with specific groups (children, cats, dogs, etc.)
      query = query.contains('good_with', [good_with]);
    }

    if (location) {
      query = query.ilike('rescue_address', `%${location}%`);
    }

    if (search) {
      // Global search across name, description, breed, and type
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,breed.ilike.%${search}%,type.ilike.%${search}%`,
      );
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        query = query.limit(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      const limitNum = limit ? parseInt(limit) : DEFAULT_LIMIT;
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        query = query.range(offsetNum, offsetNum + limitNum - 1);
      }
    }

    // If neither limit nor offset are provided, apply a sensible default limit
    if (!limit && !offset) {
      query = query.limit(DEFAULT_LIMIT);
    }

    // Apply default ordering
    query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch pets',
          message: error.message,
        }),
        { status: 500 },
      );
    }

    // If a user id was provided, compute favorite flags per pet.
    // We now populate both isFavorite (preferred) and is_favorite (deprecated) for backward compatibility.
    let responseData: (Pet & { is_favorite?: boolean; adopted?: Record<string, unknown> | null })[] | null = data as (Pet & {
      is_favorite?: boolean;
      adopted?: Record<string, unknown> | null;
    })[] | null;
    
    // Add adopted field to all pets
    if (Array.isArray(data)) {
      type AdoptionData = {
        id: number;
        status: string | null;
        happiness_image: string | null;
        created_at: string;
        user: unknown;
      };
      type PetWithAdoption = Pet & { adoption?: AdoptionData[] };
      
      responseData = (data as PetWithAdoption[]).map((pet: PetWithAdoption) => {
        const approvedAdoption = Array.isArray(pet.adoption) ? pet.adoption.find((adoption: AdoptionData) => adoption.status === 'APPROVED') : null;
        const adopted = approvedAdoption ? {
          id: approvedAdoption.id,
          status: approvedAdoption.status || 'APPROVED',
          created_at: approvedAdoption.created_at,
          user: approvedAdoption.user
        } : null;
        return { ...pet, adopted };
      });
    }
    
    if (user && Array.isArray(responseData) && responseData.length > 0) {
      try {
        const petIds = responseData.map((p) => p.id).filter(Boolean);
        let favoriteSet = new Set<number>();
        if (petIds.length > 0) {
          const { data: favs } = await supabase
            .from('favorites')
            .select('pet')
            .in('pet', petIds)
            .eq('user', user);

          type FavoriteRow = { pet: number | null };
          favoriteSet = new Set<number>((favs || []).map((f: FavoriteRow) => f.pet || 0).filter(Boolean));
        }
        // If no petIds or favorites lookup failed/empty, favoriteSet remains empty
        responseData = responseData.map((p) => {
          const fav = favoriteSet.has(p.id);
          return { ...p, isFavorite: fav, is_favorite: fav };
        });
      } catch (e) {
        // If favorites lookup fails, fall back to original data and continue
        console.error('Failed to compute favorites:', e);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Success',
        data: responseData,
        metadata: {
          total_count: count,
          returned_count: data?.length || 0,
          applied_filters: {
            type,
            breed,
            gender,
            size,
            age_range: age_min || age_max ? { min: age_min, max: age_max } : null,
            is_vaccinated: is_vaccinated ? is_vaccinated === 'true' : null,
            is_spayed_or_neutured: is_spayed_or_neutured ? is_spayed_or_neutured === 'true' : null,
            is_trained: is_trained ? is_trained === 'true' : null,
            health_status,
            request_status,
            good_with,
            location,
            search,
          },
          pagination: {
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null,
          },
        },
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error fetching pets:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch pets',
        message: 'An unexpected error occurred',
      }),
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract pet data from form
    const petDataString = formData.get('petData') as string;
    if (!petDataString) {
      return new Response(JSON.stringify({ error: 'Pet data is required' }), { status: 400 });
    }
    
    let petData;
    try {
      petData = JSON.parse(petDataString);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid pet data format' }), { status: 400 });
    }
    
    // Clean the pet data - remove fields not in schema
    const cleanedPetData = {
      color: petData.color,
      name: petData.name,
      type: petData.type,
      breed: petData.breed,
      gender: petData.gender,
      age: petData.age,
      date_of_birth: petData.date_of_birth,
      size: petData.size,
      weight: petData.weight,
      is_vaccinated: petData.is_vaccinated,
      is_spayed_or_neutured: petData.is_spayed_or_neutured,
      health_status: petData.health_status,
      good_with: petData.good_with,
      is_trained: petData.is_trained,
      rescue_address: petData.rescue_address,
      description: petData.description,
      special_needs: petData.special_needs,
      added_by: petData.added_by,
      request_status: petData.request_status,
      photos: [],
    };
    
    console.log('Validating pet data:', cleanedPetData);
    
    // Create a schema that doesn't require photos for validation
    const createPetSchemaWithoutPhotos = createPetSchema.omit({ photos: true });
    const result = createPetSchemaWithoutPhotos.safeParse(cleanedPetData);
    if (!result.success) {
      console.error('Schema validation failed:', result.error.issues);
      
      // Create user-friendly error messages
      const fieldErrors = result.error.issues.map(issue => {
        const field = issue.path.join('.');
        return `${field}: ${issue.message}`;
      });
      
      return new Response(JSON.stringify({ 
        error: 'Validation Error', 
        message: `Please fix the following issues: ${fieldErrors.join(', ')}`,
        details: result.error.issues 
      }), {
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
      color,
    } = result.data;

    // Handle image uploads
    const photoUrls: string[] = [];
    const files = formData.getAll('photos') as File[];
    
    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          // Validate file
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return new Response(JSON.stringify({ 
              error: 'File Too Large', 
              message: `Image "${file.name}" is ${sizeMB}MB. Please reduce the image size to under 5MB and try again.`
            }), { status: 400 });
          }

          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ 
              error: 'Invalid File Type', 
              message: `File "${file.name}" is not supported. Please use JPEG, PNG, or WebP images only.`
            }), { status: 400 });
          }

          // Upload to Supabase storage
          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `pets/${fileName}`;

          const arrayBuffer = await file.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(filePath, new Uint8Array(arrayBuffer), {
              contentType: file.type || 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Failed to upload image:', uploadError);
            return new Response(JSON.stringify({ 
              error: 'Image Upload Failed', 
              message: `Could not save image "${file.name}". Please check your internet connection and try again.`
            }), { status: 500 });
          }

          // Get public URL
          const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            photoUrls.push(urlData.publicUrl);
          }
        }
      }
    }

    // Create pet record with uploaded image URLs
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
        photos: photoUrls,
        color,
      })
      .select()
      .single();

    if (error) {
      // If pet creation fails, we should clean up uploaded images
      // Note: In a production system, you might want to implement a cleanup job
      console.error('Failed to create pet, uploaded images may need cleanup:', photoUrls);
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
  } catch (error) {
    console.error('Error creating pet:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500 },
    );
  }
}

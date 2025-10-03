import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for happiness image update
const happinessImageSchema = z.object({
  happiness_image: z.url('Must be a valid URL'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adoptionId = parseInt(id);

    if (isNaN(adoptionId)) {
      return createErrorResponse('Invalid adoption ID', 400, 'Adoption ID must be a number');
    }

    // Parse request body
    const body = await request.json();
    const result = happinessImageSchema.safeParse(body);
    
    if (!result.success) {
      return createErrorResponse('Invalid request data', 400, result.error.message);
    }

    const { happiness_image } = result.data;

    // Get user ID from the session/auth
    // Note: You may need to adjust this based on your auth implementation
    const userIdHeader = request.headers.get('x-user-id');
    if (!userIdHeader) {
      return createErrorResponse('Authentication required', 401, 'User ID not found in request');
    }

    // First, verify that this adoption exists and belongs to the authenticated user
    const { data: adoptionData, error: fetchError } = await supabase
      .from('adoption')
      .select('id, user, status')
      .eq('id', adoptionId)
      .single();

    if (fetchError) {
      console.error('Error fetching adoption:', fetchError);
      return createErrorResponse('Adoption not found', 404, fetchError.message);
    }

    // Check if the authenticated user is the adopter
    if (adoptionData.user !== userIdHeader) {
      return createErrorResponse(
        'Unauthorized', 
        403, 
        'Only the adopter can upload happiness images for this adoption'
      );
    }

    // Check if the adoption is approved (completed)
    if (adoptionData.status !== 'APPROVED') {
      return createErrorResponse(
        'Invalid adoption status', 
        400, 
        'Happiness images can only be uploaded for approved (completed) adoptions'
      );
    }

    // Update the adoption record with the happiness image
    const { data, error } = await supabase
      .from('adoption')
      .update({ happiness_image })
      .eq('id', adoptionId)
      .select('id, happiness_image, status, created_at')
      .single();

    if (error) {
      console.error('Error updating adoption with happiness image:', error);
      return createErrorResponse('Failed to update adoption', 500, error.message);
    }

    return new Response(
      JSON.stringify({
        message: 'Happiness image updated successfully',
        data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error in happiness image endpoint:', err);
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adoptionId = parseInt(id);

    if (isNaN(adoptionId)) {
      return createErrorResponse('Invalid adoption ID', 400, 'Adoption ID must be a number');
    }

    // Get the adoption record with happiness image
    const { data, error } = await supabase
      .from('adoption')
      .select('id, happiness_image, status, created_at, pets(*), users(*)')
      .eq('id', adoptionId)
      .single();

    if (error) {
      console.error('Error fetching adoption:', error);
      return createErrorResponse('Adoption not found', 404, error.message);
    }

    return new Response(
      JSON.stringify({
        data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error in get happiness image endpoint:', err);
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
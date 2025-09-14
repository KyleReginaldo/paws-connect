import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid user ID' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, created_by, passwordChanged, created_at')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ 
          error: 'Not Found', 
          message: 'User not found' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if account was created by another user
    const isCreatedByOther = userData.created_by !== null;
    
    // Get creator info if available
    let creatorInfo = null;
    if (isCreatedByOther && userData.created_by) {
      const { data: creatorData } = await supabase
        .from('users')
        .select('id, username, role')
        .eq('id', userData.created_by)
        .single();
      
      if (creatorData) {
        creatorInfo = {
          id: creatorData.id,
          username: creatorData.username,
          role: creatorData.role
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Success',
        data: {
          userId: userData.id,
          username: userData.username,
          isCreatedByOther,
          passwordChanged: userData.passwordChanged || false,
          needsPasswordChange: isCreatedByOther && !userData.passwordChanged,
          createdAt: userData.created_at,
          createdBy: creatorInfo
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Check user creation status error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
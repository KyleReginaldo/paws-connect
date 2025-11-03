import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for password change request
const changePasswordSchema = z.object({
  userId: z.uuid('Invalid user ID format'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid input data',
          details: validation.error.issues 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { userId, currentPassword, newPassword }: ChangePasswordDto = validation.data;

    // First, verify the current password by attempting to sign in
    const { data: userAuth, error: userAuthError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userAuthError || !userAuth?.email) {
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

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userAuth.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Current password is incorrect' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user exists and get their details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, created_by, password_changed')
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

    // Check if this account was created by another user
    const isCreatedByOther = userData.created_by !== null;

    // Update the user's password in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (authError) {
      console.error('Auth password update error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'Failed to update password in authentication system' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If account was created by another user, mark password as changed
    if (isCreatedByOther) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_changed: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        // Password was changed in auth but not marked in DB - still return success
        // but log the issue
        console.warn('Password updated in auth but failed to mark passwordChanged in database');
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Password changed successfully',
        data: {
          userId: userData.id,
          wasCreatedByOther: isCreatedByOther,
          passwordChanged: isCreatedByOther ? true : userData.password_changed
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Change password error:', error);
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
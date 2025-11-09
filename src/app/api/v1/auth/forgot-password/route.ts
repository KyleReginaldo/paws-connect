import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid email format',
          details: validation.error.issues 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email }: ForgotPasswordDto = validation.data;

    // Check if user exists in our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      // Return success even if user doesn't exist for security reasons
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link shortly.' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Only allow password reset for admin and staff accounts (role 1 and 2)
    if (userData.role !== 1 && userData.role !== 2) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link shortly.' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send password reset email using Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://paws-connect-rho.vercel.app/auth/reset-password`,
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'Failed to send password reset email' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox and follow the instructions.' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Forgot password API error:', error);
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
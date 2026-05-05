import { supabaseServer } from '@/app/supabase/supabase-server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export async function POST(request: NextRequest) {
  console.log('[forgot-password] POST request received');
  try {
    const body = await request.json();
    console.log('[forgot-password] Request body:', { email: body?.email });

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      console.warn('[forgot-password] Validation failed:', validation.error.issues);
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
    console.log('[forgot-password] Validated email:', email);

    // Check if user exists in our database
    console.log('[forgot-password] Querying user from DB...');
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, username, role')
      .eq('email', email)
      .single();

    console.log('[forgot-password] DB query result:', {
      found: !!userData,
      role: userData?.role ?? null,
      error: userError ? { code: userError.code, message: userError.message } : null,
    });

    // If there's an error or no user found, return specific error message
    if (userError || !userData) {
      console.warn('[forgot-password] User not found for email:', email);
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'No account found with this email address. Please check your email or create a new account.'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Only allow password reset for admin and staff accounts (role 1 and 2)
    console.log('[forgot-password] Role check — user role:', userData.role);
    if (userData.role !== 1) {
      console.warn('[forgot-password] Role not allowed for password reset:', userData.role);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Password reset is only available for admin and staff accounts.'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send password reset email using Supabase Auth
    const redirectTo = `https://paws-connect-rho.vercel.app/auth/reset-password`;
    console.log('[forgot-password] Sending reset email via Supabase Auth, redirectTo:', redirectTo);
    const { error: resetError } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      console.error('[forgot-password] Supabase resetPasswordForEmail error:', {
        message: resetError.message,
        status: resetError.status,
      });
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

    console.log('[forgot-password] Reset email sent successfully to:', email);
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
    console.error('[forgot-password] Unexpected error:', error);
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
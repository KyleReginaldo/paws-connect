import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for password change request
const changePasswordSchema = z.object({
  userId: z.uuid('Invalid user ID format'),
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
    const { userId, newPassword }: ChangePasswordDto = validation.data;
    const {error} = await supabase.auth.admin.updateUserById(userId,{
        password: newPassword,
    });
    if(error) {
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
    return new Response(
        JSON.stringify({ 
          data: 'Password reset successful', 
          message: 'Success'
        }),
        {
          status: 200,
        }
      );
} catch(e){
    console.error('Error resetting password:', e);
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
}
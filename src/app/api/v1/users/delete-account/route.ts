import { supabaseServer } from '@/app/supabase/supabase-server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Schema for account deletion request
const deleteAccountSchema = z.object({
 userId: z.uuid(),
});

type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = deleteAccountSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid request data',
          details: validation.error.issues 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { userId }: DeleteAccountDto = validation.data;
    const { error } = await supabaseServer.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete account', 
          message: error.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

}catch(e){
    console.error(e);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (e as Error).message }),
      {
        status: 500,
      },
    );
}
}
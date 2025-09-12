/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchUserForums } from '@/lib/db-utils';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const userId = (params as { userId: string }).userId;
    if (!userId)
      return new Response(JSON.stringify({ error: 'Missing userId param' }), { status: 400 });

    // Use the new utility function
    const forumsWithRoles = await fetchUserForums(userId, true);

    return new Response(JSON.stringify({ 
      data: forumsWithRoles,
      total: forumsWithRoles.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
      },
    );
  }
}

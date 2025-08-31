import { supabase } from '@/app/supabase/supabase';
import { createUserSchema } from '@/config/schema/userChema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  if (username) {
    return await searchUsers(username);
  } else {
    const { data, error } = await supabase.from('users').select();
    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
    });
  }
}
async function searchUsers(query: string): Promise<Response> {
  const { data, error } = await supabase.from('users').select().ilike('username', `%${query}%`);
  if (error) {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (data.length === 0)
    return new Response(JSON.stringify({ error: 'Not Found', message: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  return new Response(
    JSON.stringify({
      message: 'Success',
      data,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', issues: result.error.message }),
        { status: 400 },
      );
    }

    const { email, password, username, phone_number, role } = result.data;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role,
        username: username,
      },
    });
    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request', message: error.message }), {
        status: 400,
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: 'Not found', message: 'User not found' }), {
        status: 404,
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username,
        email,
        phone_number,
        role,
      })
      .select()
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: 'Bad Request', message: userError.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', data: user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

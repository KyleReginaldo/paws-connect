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

    const parsed = result.data as {
      email: string;
      password?: string;
      username: string;
      phone_number: string;
      role: number;
    };
    let { password, phone_number } = parsed;
    const { email, username, role } = parsed;

    // sanitize phone: remove non-digits
    phone_number = String(phone_number).replace(/\D/g, '');
    if (phone_number.length !== 11) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), { status: 400 });
    }

    // If no password provided or too weak/short, generate a default strong password
    if (!password || String(password).length < 8) {
      // Default pattern: 1 upper, 1 lower, 1 digit, 1 symbol + random digits
      const rand = Math.random().toString(36).slice(2, 8);
      password = `A@${rand}1`; // ensures complexity, e.g., A@abcd12
    }

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

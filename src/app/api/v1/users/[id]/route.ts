import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) {
      return new Response(JSON.stringify({ error: 'User not found', message: error.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Remove password from update if it's empty
    if (body.password === '') {
      delete body.password;
    }

    // If password is being updated, we need to update auth as well
    if (body.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        password: body.password,
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update password', message: authError.message }),
          { status: 400 },
        );
      }
    }

    // Update user profile data
    const updateData = { ...body };
    delete updateData.password; // Remove password from profile update

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update user', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'User updated successfully', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // First delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from auth', message: authError.message }),
        { status: 400 },
      );
    }

    // Then delete from users table
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete user', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

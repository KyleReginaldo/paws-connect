import { supabase } from '@/app/supabase/supabase';
import { updateFundraisingSchema } from '@/config/schema/fundraisingSchema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(request.url);
  try {
    const { id } = params;
    const fundraisingId = parseInt(id);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email)
      `,
      )
      .eq('id', fundraisingId)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Fundraising campaign not found', message: error.message }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
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
    const fundraisingId = parseInt(id);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), { status: 400 });
    }

    const body = await request.json();

    // Validate the request body
    const result = updateFundraisingSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('fundraising')
      .update(result.data)
      .eq('id', fundraisingId)
      .select(
        `
        *,
        created_by_user:users!created_by(username, email)
      `,
      )
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update fundraising campaign', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Fundraising campaign updated successfully', data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
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
    const fundraisingId = parseInt(id);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), { status: 400 });
    }

    // First check if there are any donations linked to this campaign
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('id')
      .eq('fundraising', fundraisingId)
      .limit(1);

    if (donationsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check donations', message: donationsError.message }),
        { status: 400 },
      );
    }

    if (donations && donations.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete campaign',
          message:
            'This campaign has donations and cannot be deleted. Consider marking it as inactive instead.',
        }),
        { status: 400 },
      );
    }

    const { error } = await supabase.from('fundraising').delete().eq('id', fundraisingId);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete fundraising campaign', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'Fundraising campaign deleted successfully' }), {
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

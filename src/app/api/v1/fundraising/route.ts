import { supabase } from '@/app/supabase/supabase';
import { createFundraisingSchema } from '@/config/schema/fundraisingSchema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('created_by');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email),
        donations_count:donations(count)
      `,
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status) {
      // Validate status is one of the allowed values
      const validStatuses = ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED'];
      if (validStatuses.includes(status)) {
        query = query.eq(
          'status',
          status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
        );
      }
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        query = query.limit(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      if (!isNaN(offsetNum)) {
        query = query.range(offsetNum, offsetNum + (parseInt(limit || '10') - 1));
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request', message: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Success',
        data,
        count,
        pagination: {
          limit: limit ? parseInt(limit) : null,
          offset: offset ? parseInt(offset) : null,
        },
      }),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createFundraisingSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { title, description, created_by, target_amount, status } = result.data;

    const { data, error } = await supabase
      .from('fundraising')
      .insert({
        title,
        description,
        target_amount,
        raised_amount: 0, // Initialize with 0
        status: status || 'PENDING', // Default to PENDING if not provided
        created_by,
      })
      .select(
        `
        *,
        created_by_user:users!created_by(username, email)
      `,
      )
      .single();

    if (error) {
      console.log(error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create fundraising campaign', message: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Fundraising campaign created successfully',
        data,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.log(err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

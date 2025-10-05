import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/notifications/user/[userId]?page=1&limit=20&since=ISO&include_deleted=false
export async function GET(request: NextRequest, context: unknown) {
  try {
    const { userId } = (context as { params: { userId: string } }).params || { userId: '' };
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;
    const since = url.searchParams.get('since');
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (err as Error).message },
      { status: 500 },
    );
  }
}


export async function POST(request: NextRequest,context: unknown) {
  const body = await request.json();
  const params = await (context as { params?: { userId: string } | Promise<{ userId: string }> }).params;
  const { notificationIds } = body;

  if (!params?.userId) {
    return createErrorResponse('Missing userId', 400);
  }
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return createErrorResponse('Invalid notificationIds', 400);
  }

  const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user', params?.userId)
      .in('id', notificationIds);
  if(error){
    return createErrorResponse('Failed to delete notifications', 500, error.message);
  }
  return createResponse({ message: 'Notifications deleted successfully' }, 200);
}

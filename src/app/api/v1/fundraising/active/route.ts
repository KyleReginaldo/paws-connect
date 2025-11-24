import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('created_by');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const userRole = searchParams.get('user_role'); // Manual role parameter
    const userId = searchParams.get('user_id'); // Automatic role detection via user lookup

    let query = supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email),
        donations_count:donations(count),
        all_donations:donations(*)
      `,
      ).eq('status', 'ONGOING')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Determine user role for filtering
    let effectiveUserRole: number | null = null;

    if (userId) {
      // Automatic role detection: lookup user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        effectiveUserRole = userData.role;
      }
    } else if (userRole) {
      // Manual role parameter
      const roleNum = parseInt(userRole);
      if (!isNaN(roleNum)) {
        effectiveUserRole = roleNum;
      }
    }

    // Role-based status filtering
    if (effectiveUserRole !== null) {
      if (effectiveUserRole === 1) {
        // Admin (role 1) can see all statuses - no additional filtering needed
        if (status) {
          const validStatuses = ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED'];
          if (validStatuses.includes(status)) {
            query = query.eq(
              'status',
              status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
            );
          }
        }
      } else {
        // Regular users (role 3, etc.) can only see ONGOING and COMPLETE
        if (status) {
          // If status is specified, validate it's allowed for regular users
          const allowedStatusesForUsers = ['ONGOING', 'COMPLETE'];
          if (allowedStatusesForUsers.includes(status)) {
            query = query.eq('status', status as 'ONGOING' | 'COMPLETE');
          } else {
            // If user tries to access admin-only statuses, return empty result
            return new Response(
              JSON.stringify({
                message:
                  'Access denied: You can only view ONGOING and COMPLETE fundraising campaigns',
                data: [],
                count: 0,
                pagination: {
                  limit: limit ? parseInt(limit) : null,
                  offset: offset ? parseInt(offset) : null,
                },
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }
        } else {
          // If no status specified, automatically filter to ONGOING and COMPLETE
          query = query.in('status', ['ONGOING', 'COMPLETE']);
        }
      }
    } else {
      // If no role information provided, apply legacy status filtering (backward compatibility)
      if (status) {
        const validStatuses = ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED'];
        if (validStatuses.includes(status)) {
          query = query.eq(
            'status',
            status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
          );
        }
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
        filters: {
          applied_role: effectiveUserRole,
          allowed_statuses:
            effectiveUserRole === 1
              ? ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED']
              : effectiveUserRole !== null
                ? ['ONGOING', 'COMPLETE']
                : 'all',
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
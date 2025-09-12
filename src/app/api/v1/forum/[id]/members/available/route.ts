/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/forum/[id]/members/available - Get users with role 3 who can be added to the forum
 * 
 * This endpoint returns users that:
 * - Have role = 3 (specific user type)
 * - Are not already members of the forum
 * - Are not the forum creator
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 20, max: 100)
 * - search: Optional username search filter
 * 
 * Response includes:
 * - Available users with id, username, profile_image_link
 * - Pagination information
 * - Total count of available users
 */
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return createErrorResponse('Invalid forum id', 400);

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    // First check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Get existing forum members (including creator)
    const { data: existingMembers, error: membersError } = await supabase
      .from('forum_members')
      .select('member')
      .eq('forum', forumId);

    if (membersError) {
      return createErrorResponse(membersError.message, 500);
    }

    // Collect all user IDs that should be excluded
    const excludeUserIds = new Set<string>();
    
    // Add forum creator if exists
    if (forum.created_by) {
      excludeUserIds.add(forum.created_by);
    }
    
    // Add existing members
    existingMembers?.forEach(member => {
      excludeUserIds.add(member.member);
    });

    // Build query for users with role 3
    let usersQuery = supabase
      .from('users')
      .select('id, username, profile_image_link', { count: 'exact' })
      .eq('role', 3);

    // Add search filter if provided
    if (search && search.trim()) {
      usersQuery = usersQuery.ilike('username', `%${search.trim()}%`);
    }

    // Exclude existing members and creator
    if (excludeUserIds.size > 0) {
      usersQuery = usersQuery.not('id', 'in', `(${Array.from(excludeUserIds).map(id => `"${id}"`).join(',')})`);
    }

    // Apply pagination
    usersQuery = usersQuery
      .order('username', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: availableUsers, error: usersError, count } = await usersQuery;

    if (usersError) {
      return createErrorResponse(usersError.message, 500);
    }

    return createResponse({
      data: availableUsers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      forum: {
        id: forum.id,
        created_by: forum.created_by
      },
      filters: {
        role: 3,
        search: search || null,
        excluded_count: excludeUserIds.size
      }
    }, 200, {
      cache: 'private, max-age=60'
    });

  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
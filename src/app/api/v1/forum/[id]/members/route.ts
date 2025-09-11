/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// GET /api/v1/forum/[id]/members - Get all members of a specific forum
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return createErrorResponse('Invalid forum id', 400);

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;

    // First check if forum exists and if it's private
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Get explicit members from forum_members table
    const { data: explicitMembers, error: membersError } = await supabase
      .from('forum_members')
      .select(`
        id,
        created_at,
        member,
        users!forum_members_member_fkey (
          id,
          username,
          profile_image_link
        )
      `)
      .eq('forum', forumId)
      .order('created_at', { ascending: false });

    if (membersError) {
      return createErrorResponse(membersError.message, 500);
    }

    // Get forum creator details if creator exists
    let creator = null;
    if (forum.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('id, username, profile_image_link')
        .eq('id', forum.created_by)
        .single();

      if (!creatorError && creatorData) {
        creator = creatorData;
      }
    }

    // Combine creator and explicit members, ensuring creator is always included if exists
    const allMembers = [];
    
    // Add creator first (with special role indicator) if creator exists
    if (creator && forum.created_by) {
      allMembers.push({
        id: `creator-${forum.created_by}`,
        created_at: forum.created_by, // Use forum creation as join date for creator
        member: forum.created_by,
        role: 'creator',
        users: creator
      });
    }

    // Add explicit members (but skip if they're the creator to avoid duplicates)
    explicitMembers?.forEach(member => {
      if (member.member !== forum.created_by) {
        allMembers.push({
          ...member,
          role: 'member'
        });
      }
    });

    // Apply pagination to the combined list
    const total = allMembers.length;
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, total);
    const paginatedMembers = allMembers.slice(startIndex, endIndex);

    return createResponse({
      data: paginatedMembers,
      forum: {
        id: forum.id,
        private: forum.private,
        created_by: forum.created_by
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 200, {
      cache: 'private, max-age=60'
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

// POST /api/v1/forum/[id]/members - Add a member to a private forum
export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId))
      return createErrorResponse('Invalid forum id', 400);

    const body = await parseJson(request);
    if (!body) return createErrorResponse('Invalid JSON', 400);

    const memberAddSchema = z
      .object({
        member: z.uuid('Invalid member ID'),
        added_by: z.uuid('Invalid user ID'),
      })
      .strict();

    const parsed = memberAddSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { member, added_by } = parsed.data;

    // Check if forum exists and if it's private
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Only allow adding members to private forums
    // if (!forum.private) {
    //   return createErrorResponse('Members can only be added to private forums', 400);
    // }

    // Only forum creator can add members
    if (forum.created_by !== added_by) {
      return createErrorResponse('Only the forum creator can add members', 403);
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', member)
      .single();

    if (userError || !user) {
      return createErrorResponse('User not found', 404);
    }

    // Check if member is already in the forum
    const { data: existingMember } = await supabase
      .from('forum_members')
      .select('id')
      .eq('forum', forumId)
      .eq('member', member)
      .single();

    if (existingMember) {
      return createErrorResponse('User is already a member of this forum', 409);
    }

    // Add member to forum
    const { data, error } = await supabase
      .from('forum_members')
      .insert({
        forum: forumId,
        member,
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        created_at,
        member,
        users!forum_members_member_fkey (
          id,
          username,
          profile_image_link
        )
      `)
      .single();

    if (error) {
      return createErrorResponse(error.message, 500);
    }

    return createResponse({
      message: 'Member added successfully',
      data
    }, 201);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

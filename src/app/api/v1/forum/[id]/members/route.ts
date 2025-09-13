/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse, invalidateForumCache } from '@/lib/db-utils';
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
    if (Number.isNaN(forumId)) return createErrorResponse('Invalid forum id', 400);

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
      .select(
        `
        id,
        created_at,
        member,
        users!forum_members_member_fkey (
          id,
          username,
          profile_image_link
        )
      `,
      )
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
        users: creator,
      });
    }

    // Add explicit members (but skip if they're the creator to avoid duplicates)
    explicitMembers?.forEach((member) => {
      if (member.member !== forum.created_by) {
        allMembers.push({
          ...member,
          role: 'member',
        });
      }
    });

    // Apply pagination to the combined list
    const total = allMembers.length;
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, total);
    const paginatedMembers = allMembers.slice(startIndex, endIndex);

    return createResponse(
      {
        data: paginatedMembers,
        forum: {
          id: forum.id,
          private: forum.private,
          created_by: forum.created_by,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      200,
      {
        cache: 'no-cache, no-store, must-revalidate',
      },
    );
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

/**
 * POST /api/v1/forum/[id]/members - Add member(s) to a forum (supports single and bulk addition)
 *
 * This endpoint supports both single member addition and bulk member addition:
 *
 * Single Member Addition:
 * POST /api/v1/forum/123/members
 * {
 *   "member": "uuid-of-user",
 *   "added_by": "uuid-of-forum-creator"
 * }
 *
 * Bulk Member Addition:
 * POST /api/v1/forum/123/members
 * {
 *   "members": ["uuid-1", "uuid-2", "uuid-3"],
 *   "added_by": "uuid-of-forum-creator"
 * }
 *
 * Features:
 * - Validates all member UUIDs
 * - Checks which users exist in the database
 * - Identifies existing members to avoid duplicates
 * - Supports up to 50 members per bulk operation
 * - Provides detailed response with operation summary
 * - Maintains backward compatibility for single member operations
 *
 * Response for bulk operations includes:
 * - summary: counts of requested, added, already_members, invalid_users
 * - details: arrays of added_members, already_members, invalid_user_ids
 */
export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    if (Number.isNaN(forumId)) return createErrorResponse('Invalid forum id', 400);

    const body = await parseJson(request);
    if (!body) return createErrorResponse('Invalid JSON', 400);

    // Define schemas for both single and bulk operations
    const singleMemberSchema = z
      .object({
        member: z.uuid('Invalid member ID'),
        added_by: z.uuid('Invalid user ID'),
      })
      .strict();

    const bulkMemberSchema = z
      .object({
        members: z
          .array(z.uuid('Invalid member ID'))
          .min(1, 'At least one member required')
          .max(50, 'Maximum 50 members allowed'),
        added_by: z.uuid('Invalid user ID'),
      })
      .strict();
    // Determine if this is a bulk or single operation
    const isBulk = Array.isArray(body.members);

    let memberIds: string[];
    let added_by: string;

    if (isBulk) {
      const parsed = bulkMemberSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse('Validation error', 400, parsed.error.issues);
      }
      memberIds = parsed.data.members;
      added_by = parsed.data.added_by;
    } else {
      const parsed = singleMemberSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse('Validation error', 400, parsed.error.issues);
      }
      memberIds = [parsed.data.member];
      added_by = parsed.data.added_by;
    }

    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return createErrorResponse('Forum not found', 404);
    }

    // Check permission to add members
    const isCreator = forum.created_by === added_by;
    const isPrivateForum = forum.private === true;

    if (isPrivateForum) {
      // Private forums: Only creator can add members
      if (!isCreator) {
        return createErrorResponse('Only the forum creator can add members to private forums', 403);
      }
    } else {
      // Public forums: Creator or approved members can add members
      if (!isCreator) {
        // Check if the user trying to add members is an approved member
        const { data: memberCheck, error: memberError } = await supabase
          .from('forum_members')
          .select('invitation_status')
          .eq('forum', forumId)
          .eq('member', added_by)
          .eq('invitation_status', 'APPROVED')
          .single();

        if (memberError || !memberCheck) {
          return createErrorResponse('Only approved members can invite others to public forums', 403);
        }
      }
    }

    // Remove duplicates from member IDs
    const uniqueMemberIds = [...new Set(memberIds)];

    // Check which users exist
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', uniqueMemberIds);

    if (usersError) {
      return createErrorResponse(usersError.message, 500);
    }

    const existingUserIds = existingUsers?.map((user) => user.id) || [];
    const invalidUserIds = uniqueMemberIds.filter((id) => !existingUserIds.includes(id));

    // Check which users are already members
    const { data: existingMembers, error: membersError } = await supabase
      .from('forum_members')
      .select('member')
      .eq('forum', forumId)
      .in('member', existingUserIds);

    if (membersError) {
      return createErrorResponse(membersError.message, 500);
    }

    const existingMemberIds = existingMembers?.map((member) => member.member) || [];
    const newMemberIds = existingUserIds.filter((id) => !existingMemberIds.includes(id));

    // Prepare bulk insert data
    const insertData = newMemberIds.map((memberId) => ({
      forum: forumId,
      member: memberId,
      invitation_status: 'APPROVED' as const, // Members added by creator are automatically approved
      created_at: new Date().toISOString(),
    }));

    interface AddedMember {
      id: number;
      created_at: string;
      member: string;
      users: {
        id: string;
        username: string | null;
        profile_image_link: string | null;
      };
    }

    let addedMembers: AddedMember[] = [];
    if (insertData.length > 0) {
      // Add new members to forum
      const { data, error } = await supabase.from('forum_members').insert(insertData).select(`
          id,
          created_at,
          member,
          users!forum_members_member_fkey (
            id,
            username,
            profile_image_link
          )
        `);

      if (error) {
        return createErrorResponse(error.message, 500);
      }
      addedMembers = (data as AddedMember[]) || [];
    }

    // Prepare response with detailed results
    const result = {
      message: isBulk ? 'Bulk member operation completed' : 'Member operation completed',
      summary: {
        requested: uniqueMemberIds.length,
        added: addedMembers.length,
        already_members: existingMemberIds.length,
        invalid_users: invalidUserIds.length,
      },
      details: {
        added_members: addedMembers,
        already_members: existingMemberIds,
        invalid_user_ids: invalidUserIds,
      },
    };

    // For single member operations, maintain backward compatibility
    if (!isBulk) {
      if (addedMembers.length === 1) {
        // Invalidate forum cache for immediate data refresh
        invalidateForumCache(forumId);
        return createResponse(
          {
            message: 'Member added successfully',
            data: addedMembers[0],
          },
          201,
        );
      } else if (existingMemberIds.length === 1) {
        return createErrorResponse('User is already a member of this forum', 409);
      } else if (invalidUserIds.length === 1) {
        return createErrorResponse('User not found', 404);
      }
    }

    // For bulk operations, return detailed summary
    const statusCode = addedMembers.length > 0 ? 201 : 200;

    // Invalidate forum cache if any members were added to ensure fresh data
    if (addedMembers.length > 0) {
      invalidateForumCache(forumId);
    }

    return createResponse(result, statusCode);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

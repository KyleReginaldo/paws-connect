import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const createdBy = url.searchParams.get('created_by');
    const userId = url.searchParams.get('user_id'); // Current user to check private forum access
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;

    let accessibleForumIds: number[] = [];

    // If user_id is provided, get forums they have access to
    if (userId) {
      // Get private forums where user is a member
      const { data: memberForums } = await supabase
        .from('forum_members')
        .select('forum')
        .eq('member', userId);

      // Get all forums created by the user
      const { data: createdForums } = await supabase
        .from('forum')
        .select('id')
        .eq('created_by', userId);

      // Combine accessible forum IDs
      const memberForumIds = memberForums?.map(f => f.forum) || [];
      const createdForumIds = createdForums?.map(f => f.id) || [];
      accessibleForumIds = [...new Set([...memberForumIds, ...createdForumIds])];
    }

    // Base query with selective fields
    let query = supabase
      .from('forum')
      .select(`
        id,
        forum_name,
        created_at,
        updated_at,
        created_by,
        private,
        users!forum_created_by_fkey (
          id,
          username
        ),
        forum_members!forum_members_forum_fkey (
          id,
          created_at,
          member,
          users!forum_members_member_fkey (
            id,
            username,
            profile_image_link
          )
        )
      `, { count: 'exact' });

    // Apply privacy filter
    if (userId && accessibleForumIds.length > 0) {
      // User can see: public forums OR private forums they have access to
      query = query.or(`private.is.null,private.eq.false,id.in.(${accessibleForumIds.join(',')})`);
    } else {
      // No user or no accessible private forums, only show public forums
      query = query.or('private.is.null,private.eq.false');
    }

    // Apply additional filters
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process data to add member counts and ensure creator is included
    const forumsWithMemberInfo = (data || []).map(forum => {
      const explicitMembers = forum.forum_members || [];
      
      // Flatten the member structure to remove nested users object
      const flattenedMembers = explicitMembers.map(member => ({
        id: member.users?.id || member.member,
        username: member.users?.username || '',
        profile_image_link: member.users?.profile_image_link || null,
        joined_at: member.created_at
      }));
      
      // Calculate total member count (explicit members + creator if not already a member)
      let memberCount = explicitMembers.length;
      const creatorIsExplicitMember = explicitMembers.some(
        member => member.member === forum.created_by
      );
      
      if (forum.created_by && !creatorIsExplicitMember) {
        memberCount += 1; // Add creator to count
      }

      return {
        id: forum.id,
        forum_name: forum.forum_name,
        created_at: forum.created_at,
        updated_at: forum.updated_at,
        created_by: forum.created_by,
        private: forum.private,
        users: forum.users,
        member_count: memberCount,
        members: flattenedMembers
      };
    });

    return new Response(JSON.stringify({ 
      data: forumsWithMemberInfo,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30'
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const forumCreateSchema = z
      .object({
        forum_name: z.string().min(1, 'Forum name is required').max(100, 'Forum name too long'),
        created_by: z.uuid('Invalid user ID'),
        private: z.boolean().optional()
      })
      .strict();

    const parsed = forumCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const now = new Date().toISOString();
    const row = { 
      ...parsed.data, 
      created_at: now,
      updated_at: now
    };

    // Optimized insert with selective return fields
    const { data, error } = await supabase
      .from('forum')
      .insert(row)
      .select(`
        id,
        forum_name,
        created_at,
        updated_at,
        created_by,
        private,
        users!forum_created_by_fkey (
          id,
          username
        )
      `)
      .single();
      
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      },
    );
  }
}

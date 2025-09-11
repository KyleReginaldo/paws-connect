/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const userId = (params as { userId: string }).userId;
    if (!userId)
      return new Response(JSON.stringify({ error: 'Missing userId param' }), { status: 400 });

    // Get forums where user is the creator
    const { data: createdForums, error: createdError } = await supabase
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
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (createdError) {
      return new Response(JSON.stringify({ error: createdError.message }), { status: 500 });
    }

    // Get forums where user is a member
    const { data: memberForums, error: memberError } = await supabase
      .from('forum_members')
      .select(`
        forum!inner (
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
        )`)
      .eq('member', userId);

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), { status: 500 });
    }

    // Combine and deduplicate forums (in case user is both creator and member)
    const allForums = [...(createdForums || [])];
    const memberForumsList = memberForums?.map(mf => mf.forum).filter(Boolean) || [];
    
    // Add member forums that aren't already in created forums
    memberForumsList.forEach(memberForum => {
      const isDuplicate = allForums.some(forum => forum.id === memberForum.id);
      if (!isDuplicate) {
        allForums.push(memberForum);
      }
    });

    // Sort all forums by creation date (newest first)
    allForums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Add role information to each forum and flatten member structure
    const forumsWithRoles = allForums.map(forum => {
      const explicitMembers = forum.forum_members || [];
      
      // Flatten the member structure to remove nested users object
      const flattenedMembers = explicitMembers.map(member => ({
        id: member.users?.id || member.member,
        username: member.users?.username || '',
        profile_image_link: member.users?.profile_image_link || null,
        joined_at: member.created_at
      }));

      // Calculate member count properly - don't double count creator
      const creatorIsExplicitMember = flattenedMembers.some(m => m.id === forum.created_by);
      const memberCount = flattenedMembers.length + (forum.created_by && !creatorIsExplicitMember ? 1 : 0);

      // Create clean forum object without forum_members
      const cleanForum = {
        id: forum.id,
        forum_name: forum.forum_name,
        created_at: forum.created_at,
        updated_at: forum.updated_at,
        created_by: forum.created_by,
        private: forum.private,
        users: forum.users
      };

      return {
        ...cleanForum,
        user_role: forum.created_by === userId ? 'creator' : 'member',
        members: flattenedMembers,
        member_count: memberCount
      };
    });

    return new Response(JSON.stringify({ 
      data: forumsWithRoles,
      total: forumsWithRoles.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
      },
    );
  }
}

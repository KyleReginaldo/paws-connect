import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function getOrCreateGlobalForum() {
  const { data: existingForum, error: getError } = await supabase
    .from('forum')
    .select('id')
    .eq('forum_name', 'Global Chat')
    .eq('private', false)
    .single();

  if (existingForum) return { data: existingForum, error: null };

  if (getError && getError.code === 'PGRST116') {
    const { data: newForum, error: createError } = await supabase
      .from('forum')
      .insert({
        forum_name: 'Global Chat',
        forum_description: 'A place for all users and admins to communicate',
        private: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    return { data: newForum, error: createError };
  }

  return { data: null, error: getError };
}

// POST /api/v1/global-chat/viewers - mark messages as viewed by a user
export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const { user_id, message_ids } = body as { user_id?: string; message_ids?: number[] };
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });

    const { data: globalForum, error: forumError } = await getOrCreateGlobalForum();
    if (forumError || !globalForum) {
      return new Response(JSON.stringify({ error: 'Failed to access global chat forum' }), { status: 500 });
    }

    // Fetch recent messages (or provided message_ids)
    let query = supabase
      .from('forum_chats')
      .select('id, viewers')
      .eq('forum', globalForum.id)
      .order('sent_at', { ascending: false })
      .limit(200);

    if (Array.isArray(message_ids) && message_ids.length > 0) {
      query = supabase.from('forum_chats').select('id, viewers').in('id', message_ids);
    }

    const { data: rows, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const toUpdate = (rows || []).filter((r) => !Array.isArray(r.viewers) || !r.viewers.includes(user_id));

    // Update each message by setting viewers = array_unique([...viewers, user_id])
    await Promise.all(
      toUpdate.map(async (r) => {
        const newViewers = Array.isArray(r.viewers) ? Array.from(new Set([...r.viewers, user_id])) : [user_id];
        try {
          await supabase.from('forum_chats').update({ viewers: newViewers }).eq('id', r.id);
        } catch (e) {
          // swallow per-row errors
          console.error('Failed to update viewers for message', r.id, e);
        }
      }),
    );

    return new Response(JSON.stringify({ success: true, updated: toUpdate.length }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }), { status: 500 });
  }
}

import { supabase } from '@/app/supabase/supabase';

async function getOrCreateGlobalForum() {
  // First try to get the existing forum
  const { data: existingForum, error: getError } = await supabase
    .from('forum')
    .select('id')
    .eq('forum_name', 'Global Chat')
    .eq('private', false)
    .single();

  if (existingForum) {
    return { data: existingForum, error: null };
  }

  // If forum doesn't exist (PGRST116 = no rows returned), create it
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

  // Some other error occurred
  return { data: null, error: getError };
}

export async function GET() {
  try {
    const { data: globalForum, error: forumError } = await getOrCreateGlobalForum();

    if (forumError || !globalForum) {
      return new Response(
        JSON.stringify({ error: 'Failed to access global chat forum' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        forum_id: globalForum.id,
        forum_name: 'Global Chat'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Forum info API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
import { supabase } from '@/app/supabase/supabase';

// POST /api/v1/setup/global-chat - Create Global Chat forum if it doesn't exist
export async function POST() {
  try {
    // Check if Global Chat forum already exists
    const { data: existingForum, error: checkError } = await supabase
      .from('forum')
      .select('id')
      .eq('forum_name', 'Global Chat')
      .single();

    if (existingForum) {
      return new Response(
        JSON.stringify({ 
          message: 'Global Chat forum already exists',
          forum_id: existingForum.id 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Create the Global Chat forum
    const { data: newForum, error: createError } = await supabase
      .from('forum')
      .insert({
        forum_name: 'Global Chat',
        private: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    // Optional: Create initial welcome message from first admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 1) // Admin role
      .limit(1)
      .single();

    if (adminUser) {
      const { error: messageError } = await supabase
        .from('forum_chats')
        .insert({
          forum: newForum.id,
          message: 'Welcome to the Global Chat! This is a space for all community members to connect and communicate. 🐾',
          sender: adminUser.id, // Admin user as sender
          sent_at: new Date().toISOString(),
        });

      if (messageError) {
        console.warn('Failed to create welcome message:', messageError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Global Chat forum created successfully',
        forum_id: newForum.id 
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error setting up Global Chat forum:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup Global Chat forum',
        message: (error as Error).message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
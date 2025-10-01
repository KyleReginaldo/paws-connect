/* eslint-disable @typescript-eslint/no-explicit-any */
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

// GET /api/v1/forum/[id]/chats/[chatId]/reactions - Get all reactions for a specific chat message
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);
    
    if (Number.isNaN(forumId)) {
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });
    }
    if (Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid chat id' }), { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id'); // Current user for privacy check

    // Check forum exists and get privacy setting
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Check access for private forums
    if (forum.private && userId) {
      const isCreator = forum.created_by === userId;

      if (!isCreator) {
        const { data: membership } = await supabase
          .from('forum_members')
          .select('id')
          .eq('forum', forumId)
          .eq('member', userId)
          .single();

        if (!membership) {
          return new Response(JSON.stringify({ error: 'Access denied to private forum' }), {
            status: 403,
          });
        }
      }
    } else if (forum.private && !userId) {
      return new Response(JSON.stringify({ error: 'Authentication required for private forum' }), {
        status: 401,
      });
    }

    // Verify chat message exists in this forum
    const { data: chat, error: chatError } = await supabase
      .from('forum_chats')
      .select('id, forum')
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (chatError || !chat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Get current reactions from the chat message
    const { data: chatData, error: chatDataError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (chatDataError) {
      return new Response(JSON.stringify({ error: chatDataError.message }), { status: 500 });
    }

    // Parse reactions (stored as array of objects: [{ emoji: "😀", users: ["user1", "user2"] }])
    const reactions = (chatData as any)?.reactions || [];

    // Group reactions by emoji and count them
    const reactionSummary: Record<string, { count: number; users: string[] }> = {};
    
    if (Array.isArray(reactions)) {
      reactions.forEach((reaction: any) => {
        if (reaction.emoji && Array.isArray(reaction.users)) {
          reactionSummary[reaction.emoji] = {
            count: reaction.users.length,
            users: reaction.users,
          };
        }
      });
    }

    // Convert to object format for easier frontend consumption
    const reactionsObject: Record<string, string[]> = {};
    reactions.forEach((reaction: any) => {
      if (reaction.emoji && Array.isArray(reaction.users)) {
        reactionsObject[reaction.emoji] = reaction.users;
      }
    });

    return new Response(
      JSON.stringify({
        data: reactionsObject,
        summary: reactionSummary,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      {
        status: 500,
      },
    );
  }
}

// POST /api/v1/forum/[id]/chats/[chatId]/reactions - Add a reaction to a specific chat message
export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);
    
    if (Number.isNaN(forumId)) {
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });
    }
    if (Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid chat id' }), { status: 400 });
    }

    const body = await parseJson(request);
    if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

    const reactionCreateSchema = z
      .object({
        user_id: z.uuid('Invalid user ID'),
        reaction: z.string().min(1, 'Reaction cannot be empty').max(10, 'Reaction too long'),
      })
      .strict();

    const parsed = reactionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: parsed.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { user_id, reaction } = parsed.data;

    // Check forum exists and get privacy setting
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Check access for private forums
    if (forum.private) {
      const isCreator = forum.created_by === user_id;

      if (!isCreator) {
        const { data: membership } = await supabase
          .from('forum_members')
          .select('id')
          .eq('forum', forumId)
          .eq('member', user_id)
          .single();

        if (!membership) {
          return new Response(JSON.stringify({ error: 'Access denied to private forum' }), {
            status: 403,
          });
        }
      }
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Verify chat message exists in this forum
    const { data: chat, error: chatError } = await supabase
      .from('forum_chats')
      .select('id, forum')
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (chatError || !chat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Check if user already reacted with this emoji by getting current reactions
    const { data: currentChat, error: currentChatError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (currentChatError) {
      return new Response(JSON.stringify({ error: currentChatError.message }), { status: 500 });
    }

    const currentReactions = (currentChat as any)?.reactions || [];
    
    // Check if user already reacted with this emoji
    let existingReactionIndex = -1;
    if (Array.isArray(currentReactions)) {
      existingReactionIndex = currentReactions.findIndex((r: any) => 
        r.emoji === reaction && Array.isArray(r.users) && r.users.includes(user_id)
      );
    }

    if (existingReactionIndex !== -1) {
      return new Response(
        JSON.stringify({ error: 'User has already reacted with this emoji' }), 
        { status: 409 }
      );
    }

    // Add the user's reaction
    const updatedReactions = [...currentReactions];
    const reactionIndex = updatedReactions.findIndex((r: any) => r.emoji === reaction);
    
    if (reactionIndex !== -1) {
      // Add user to existing emoji reaction
      updatedReactions[reactionIndex].users.push(user_id);
    } else {
      // Create new emoji reaction
      updatedReactions.push({
        emoji: reaction,
        users: [user_id]
      });
    }

    // Update the forum_chats table with new reactions (cast for type safety)
    const { data, error } = await supabase
      .from('forum_chats')
      .update({ reactions: updatedReactions } as any)
      .eq('id', chatId)
      .select(`
        id,
        reactions
      `)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Convert array format to object format for response
    const reactionsObject: Record<string, string[]> = {};
    const responseReactions = (data as any)?.reactions || [];
    if (Array.isArray(responseReactions)) {
      responseReactions.forEach((r: any) => {
        if (r.emoji && Array.isArray(r.users)) {
          reactionsObject[r.emoji] = r.users;
        }
      });
    }

    return new Response(JSON.stringify({ 
      data: { 
        chat_id: chatId,
        user_id,
        reaction,
        reactions: reactionsObject
      } 
    }), {
      status: 201,
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

// DELETE /api/v1/forum/[id]/chats/[chatId]/reactions - Remove a reaction from a specific chat message
export async function DELETE(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const forumId = Number((params as { id: string }).id);
    const chatId = Number((params as { chatId: string }).chatId);
    
    if (Number.isNaN(forumId)) {
      return new Response(JSON.stringify({ error: 'Invalid forum id' }), { status: 400 });
    }
    if (Number.isNaN(chatId)) {
      return new Response(JSON.stringify({ error: 'Invalid chat id' }), { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const reactionEmoji = url.searchParams.get('reaction');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }
    if (!reactionEmoji) {
      return new Response(JSON.stringify({ error: 'reaction is required' }), { status: 400 });
    }

    // Check forum exists and get privacy setting
    const { data: forum, error: forumError } = await supabase
      .from('forum')
      .select('id, private, created_by')
      .eq('id', forumId)
      .single();

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }

    // Check access for private forums
    if (forum.private) {
      const isCreator = forum.created_by === userId;

      if (!isCreator) {
        const { data: membership } = await supabase
          .from('forum_members')
          .select('id')
          .eq('forum', forumId)
          .eq('member', userId)
          .single();

        if (!membership) {
          return new Response(JSON.stringify({ error: 'Access denied to private forum' }), {
            status: 403,
          });
        }
      }
    }

    // Verify chat message exists in this forum
    const { data: chat, error: chatError } = await supabase
      .from('forum_chats')
      .select('id, forum')
      .eq('id', chatId)
      .eq('forum', forumId)
      .single();

    if (chatError || !chat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Get current reactions from the chat message
    const { data: currentChat, error: currentChatError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (currentChatError) {
      return new Response(JSON.stringify({ error: currentChatError.message }), { status: 500 });
    }

    const currentReactions = (currentChat as any)?.reactions || [];
    
    // Find the reaction to remove
    let reactionIndex = -1;
    let userFound = false;
    
    if (Array.isArray(currentReactions)) {
      reactionIndex = currentReactions.findIndex((r: any) => r.emoji === reactionEmoji);
      if (reactionIndex !== -1 && Array.isArray(currentReactions[reactionIndex].users)) {
        userFound = currentReactions[reactionIndex].users.includes(userId);
      }
    }
    
    if (reactionIndex === -1 || !userFound) {
      return new Response(JSON.stringify({ error: 'Reaction not found' }), { status: 404 });
    }

    // Remove the user from the reaction
    const updatedReactions = [...currentReactions];
    const updatedUserList = updatedReactions[reactionIndex].users.filter((id: string) => id !== userId);
    
    if (updatedUserList.length === 0) {
      // Remove the entire emoji if no users remain
      updatedReactions.splice(reactionIndex, 1);
    } else {
      updatedReactions[reactionIndex].users = updatedUserList;
    }

    // Update the forum_chats table with new reactions
    const { data: deletedReaction, error } = await supabase
      .from('forum_chats')
      .update({ reactions: updatedReactions } as any)
      .eq('id', chatId)
      .select('reactions')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Convert array format to object format for response
    const reactionsObject: Record<string, string[]> = {};
    const responseReactions = (deletedReaction as any)?.reactions || [];
    if (Array.isArray(responseReactions)) {
      responseReactions.forEach((r: any) => {
        if (r.emoji && Array.isArray(r.users)) {
          reactionsObject[r.emoji] = r.users;
        }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Reaction removed successfully', 
      data: { 
        chat_id: chatId,
        user_id: userId,
        reaction: reactionEmoji,
        reactions: reactionsObject
      } 
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
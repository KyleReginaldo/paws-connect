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

    // Fast single query to get reactions
    const { data: chatData, error: chatDataError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (chatDataError) {
      return new Response(JSON.stringify({ error: chatDataError.message }), { status: 500 });
    }

    const reactions = (chatData as any)?.reactions || [];

    // Fast processing - minimal operations
    const reactionSummary: Record<string, { count: number; users: string[] }> = {};
    const reactionsObject: Record<string, string[]> = {};
    
    reactions.forEach((reaction: any) => {
      if (reaction.emoji && reaction.users) {
        reactionsObject[reaction.emoji] = reaction.users;
        reactionSummary[reaction.emoji] = {
          count: reaction.users.length,
          users: reaction.users,
        };
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

    // Fast permission and validation check - combine queries for speed
    const [forumResult, userResult, chatResult] = await Promise.all([
      supabase
        .from('forum')
        .select('id, private, created_by')
        .eq('id', forumId)
        .single(),
      supabase
        .from('users')
        .select('id')
        .eq('id', user_id)
        .single(),
      supabase
        .from('forum_chats')
        .select('id, forum')
        .eq('id', chatId)
        .eq('forum', forumId)
        .single()
    ]);

    const { data: forum, error: forumError } = forumResult;
    const { data: user, error: userError } = userResult;
    const { data: chat, error: chatError } = chatResult;

    if (forumError || !forum) {
      return new Response(JSON.stringify({ error: 'Forum not found' }), { status: 404 });
    }
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    if (chatError || !chat) {
      return new Response(JSON.stringify({ error: 'Chat message not found' }), { status: 404 });
    }

    // Check private forum access only if needed
    if (forum.private && forum.created_by !== user_id) {
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

    // Get current reactions and update in one operation for speed
    const { data: currentChat, error: currentChatError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (currentChatError) {
      return new Response(JSON.stringify({ error: currentChatError.message }), { status: 500 });
    }

    const currentReactions = (currentChat as any)?.reactions || [];
    
    // Check if user already has this exact emoji reaction
    const existingReactionIndex = currentReactions.findIndex((r: any) => 
      r.emoji === reaction && r.users.includes(user_id)
    );

    let updatedReactions = [...currentReactions];
    let actionTaken = '';

    if (existingReactionIndex !== -1) {
      // User clicked same emoji - remove their reaction (toggle off)
      const updatedUsers = updatedReactions[existingReactionIndex].users.filter((id: string) => id !== user_id);
      
      if (updatedUsers.length === 0) {
        // Remove entire emoji if no users remain
        updatedReactions.splice(existingReactionIndex, 1);
      } else {
        updatedReactions[existingReactionIndex].users = updatedUsers;
      }
      actionTaken = 'removed';
    } else {
      // User clicked different emoji or no previous reaction - add new reaction
      // First remove user from any existing reactions (one reaction per user rule)
      updatedReactions = updatedReactions.map((r: any) => ({
        ...r,
        users: r.users.filter((userId: string) => userId !== user_id)
      })).filter((r: any) => r.users.length > 0); // Remove empty emoji reactions

      // Add the user's new reaction
      const newReactionIndex = updatedReactions.findIndex((r: any) => r.emoji === reaction);
      
      if (newReactionIndex !== -1) {
        // Add user to existing emoji reaction
        updatedReactions[newReactionIndex].users.push(user_id);
      } else {
        // Create new emoji reaction
        updatedReactions.push({
          emoji: reaction,
          users: [user_id]
        });
      }
      actionTaken = 'added';
    }

    // Single database update for maximum speed
    const { data, error } = await supabase
      .from('forum_chats')
      .update({ reactions: updatedReactions } as any)
      .eq('id', chatId)
      .select('reactions')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Fast response - minimal data processing
    const responseReactions = (data as any)?.reactions || [];
    const reactionsObject: Record<string, string[]> = {};
    responseReactions.forEach((r: any) => {
      if (r.emoji && r.users) {
        reactionsObject[r.emoji] = r.users;
      }
    });

    return new Response(JSON.stringify({ 
      data: { 
        chat_id: chatId,
        user_id,
        reaction,
        action: actionTaken, // 'added' or 'removed'
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

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
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

    // Get current reactions and remove user from all emojis (fast operation)
    const { data: currentChat, error: currentChatError } = await supabase
      .from('forum_chats')
      .select('reactions')
      .eq('id', chatId)
      .single();

    if (currentChatError) {
      return new Response(JSON.stringify({ error: currentChatError.message }), { status: 500 });
    }

    const currentReactions = (currentChat as any)?.reactions || [];
    
    // Find which emoji the user reacted with and remove them from all reactions
    let userHadReaction = false;
    let removedFromEmoji = '';
    
    const updatedReactions = currentReactions
      .map((r: any) => {
        const originalLength = r.users.length;
        const filteredUsers = r.users.filter((id: string) => id !== userId);
        
        if (filteredUsers.length < originalLength) {
          userHadReaction = true;
          removedFromEmoji = r.emoji;
        }
        
        return {
          ...r,
          users: filteredUsers
        };
      })
      .filter((r: any) => r.users.length > 0); // Remove empty emoji reactions
    
    if (!userHadReaction) {
      return new Response(JSON.stringify({ error: 'User has no reaction to remove' }), { status: 404 });
    }

    // Fast single update
    const { data: deletedReaction, error } = await supabase
      .from('forum_chats')
      .update({ reactions: updatedReactions } as any)
      .eq('id', chatId)
      .select('reactions')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Fast response processing
    const responseReactions = (deletedReaction as any)?.reactions || [];
    const reactionsObject: Record<string, string[]> = {};
    responseReactions.forEach((r: any) => {
      if (r.emoji && r.users) {
        reactionsObject[r.emoji] = r.users;
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Reaction removed successfully', 
      data: { 
        chat_id: chatId,
        user_id: userId,
        reaction: removedFromEmoji,
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
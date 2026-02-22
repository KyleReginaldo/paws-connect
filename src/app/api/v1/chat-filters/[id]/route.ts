import { supabaseServer } from '@/app/supabase/supabase-server';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseServer
      .from('chat_filters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return createErrorResponse('Chat filter not found', 404, error.message);
    }

    return createResponse({ message: 'Success', data }, 200);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if filter exists
    const { data: existingFilter, error: existingError } = await supabaseServer
      .from('chat_filters')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existingFilter) {
      return createErrorResponse('Chat filter not found', 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (body.word !== undefined && body.word !== existingFilter.word) {
      const normalizedWord = body.word.toLowerCase().trim();
      
      if (normalizedWord.length === 0) {
        return createErrorResponse('Word/phrase cannot be empty', 400);
      }

      // Check for duplicate word
      const { data: duplicateFilter } = await supabaseServer
        .from('chat_filters')
        .select('id')
        .eq('word', normalizedWord)
        .neq('id', id)
        .single();

      if (duplicateFilter) {
        return createErrorResponse('This word/phrase already exists in filters', 409);
      }

      updateData.word = normalizedWord;
    }

    if (body.category !== undefined) {
      updateData.category = body.category;
    }

    if (body.severity !== undefined) {
      updateData.severity = body.severity;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return createResponse({ message: 'No changes to update', data: existingFilter }, 200);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('chat_filters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to update chat filter', 400, error.message);
    }

    return createResponse({ message: 'Chat filter updated successfully', data }, 200);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if filter exists
    const { data: existingFilter, error: existingError } = await supabaseServer
      .from('chat_filters')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existingFilter) {
      return createErrorResponse('Chat filter not found', 404);
    }

    const { error } = await supabaseServer.from('chat_filters').delete().eq('id', id);

    if (error) {
      return createErrorResponse('Failed to delete chat filter', 400, error.message);
    }

    return createResponse({ message: 'Chat filter deleted successfully' }, 200);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

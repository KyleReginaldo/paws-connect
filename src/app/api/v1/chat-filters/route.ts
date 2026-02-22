import { supabaseServer } from '@/app/supabase/supabase-server';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('chat_filters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch chat filters', 400, error.message);
    }

    return createResponse({ message: 'Success', data }, 200);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, category = 'profanity', severity = 2, is_active = true } = body;

    // Validation
    if (!word || word.trim().length === 0) {
      return createErrorResponse('Word/phrase is required', 400);
    }

    // Check for duplicate word
    const { data: existingFilter } = await supabaseServer
      .from('chat_filters')
      .select('id')
      .eq('word', word.toLowerCase().trim())
      .single();

    if (existingFilter) {
      return createErrorResponse('This word/phrase already exists in filters', 409);
    }

    // Insert new filter
    const { data, error } = await supabaseServer
      .from('chat_filters')
      .insert({
        word: word.toLowerCase().trim(),
        category,
        severity,
        is_active,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create chat filter', 400, error.message);
    }

    return createResponse({ message: 'Chat filter created successfully', data }, 201);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

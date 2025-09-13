/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/supabase/supabase';
import {
  FORUM_SELECT_FIELDS,
  createErrorResponse,
  createResponse,
  fetchForumWithMembers,
} from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId)) return createErrorResponse('Invalid id', 400);

    const forumWithMembers = await fetchForumWithMembers(pathId, false);

    if (!forumWithMembers) {
      return createErrorResponse('Forum not found', 404);
    }

    // No cache headers - always fetch fresh data
    return createResponse({ data: forumWithMembers }, 200, {
      cache: 'no-cache, no-store, must-revalidate',
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId)) return createErrorResponse('Invalid id', 400);

    const body = await parseJson(request);
    if (!body) return createErrorResponse('Invalid JSON', 400);

    const forumUpdateSchema = z
      .object({
        forum_name: z
          .string()
          .min(1, 'Forum name is required')
          .max(100, 'Forum name too long')
          .optional(),
        updated_at: z.string().optional(),
      })
      .strict();

    const parsed = forumUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const updatePayload = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('forum')
      .update(updatePayload)
      .eq('id', pathId)
      .select(FORUM_SELECT_FIELDS)
      .single();

    if (error) return createErrorResponse(error.message, 500);

    return createResponse({ data });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const pathId = Number((params as { id: string }).id);
    if (Number.isNaN(pathId)) return createErrorResponse('Invalid id', 400);

    const { data, error } = await supabase
      .from('forum')
      .delete()
      .eq('id', pathId)
      .select('id')
      .single();

    if (error) return createErrorResponse(error.message, 500);

    return createResponse({ data });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

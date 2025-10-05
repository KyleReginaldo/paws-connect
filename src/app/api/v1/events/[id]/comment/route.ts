import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const pathId = Number(id);
    const body = await request.json();
    if (Number.isNaN(pathId)) return createErrorResponse('Invalid id', 400);
    if (!body) return createErrorResponse('Invalid JSON', 400);
    const commentSchema = z
          .object({
            user: z.uuid(),
            content: z.string().min(1).max(500),
          })
          .strict();
    
    const commentBody = commentSchema.safeParse(body);
    if(commentBody.error) {
        return createErrorResponse('Invalid comment body', 400);
    }else{
        const {data, error} = await supabase.from('event_comments').insert({
            ...commentBody.data,
            event: pathId
        }).select('*').single();
        if(error){
            return createErrorResponse(error.message, 500);
        }else{
            return createResponse(data, 201);
        }
    }
}
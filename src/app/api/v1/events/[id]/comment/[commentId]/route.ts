import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse, createResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
    const { commentId } = await params;
    const pathId = Number(commentId);
    if (Number.isNaN(pathId)) return createErrorResponse('Invalid id', 400);
    const {  error } = await supabase.from('event_comments').delete().eq('id', pathId);
    if (error) {
        return createErrorResponse(error.message, 500);
    } else {
        return createResponse({ message: 'Comment deleted successfully' }, 200);
    }
}
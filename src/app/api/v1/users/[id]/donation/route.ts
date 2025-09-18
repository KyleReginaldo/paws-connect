import { supabase } from "@/app/supabase/supabase";
import { createErrorResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }){
    try{
        const { id } = await params;
        const {data, error} = await supabase.from('donations').select('*, fundraising(*)').eq('donor',id);
        if (error) {
            return createErrorResponse(error.message, 400, (error as Error).message);
        }
        return new Response(JSON.stringify({
            data
        }), { status: 200 });
    } catch(err){
        return createErrorResponse('Internal Server Error', 500, (err as Error).message);
    }
}
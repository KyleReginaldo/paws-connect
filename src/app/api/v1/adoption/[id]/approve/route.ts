import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function PUT(_request: NextRequest, context: unknown) {
    const params = await (context as { params?: { id: string } | Promise<{ id: string }> }).params;
    const pathId = Number(params?.id ?? NaN);
    console.log('pathId:', pathId);
    if (Number.isNaN(pathId)){
        return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }else{
        console.log('Approving adoption request with id:', pathId);
       const { data , error} =  await supabase
        .from('adoption')
        .update({ status: 'APPROVED' })
        .eq('id', pathId).select().single();
        console.log(data);
        if(error ) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
        return new Response(JSON.stringify({ message: `Adoption request with id ${pathId} approved.` }), { status: 200 });
    }

}

import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const pollSchema = z.object({
          pet: z.number(),
          suggested_name: z.string(),
          created_by: z.uuid(),
        }).strict();
    const parsed = pollSchema.safeParse(body);
    if (!parsed.success) {
        return new Response(
            JSON.stringify({ error: "Validation error", details: parsed.error.issues }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    const {data, error} = await supabase.from('poll').insert({
        pet: parsed.data.pet,
        suggested_name: parsed.data.suggested_name,
        created_by: parsed.data.created_by,
    }).select().single();

    if (error) {
        return new Response(
            JSON.stringify({ error: "Failed to create poll", message: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { "Content-Type": "application/json" } }
    );

}

export async function GET(request: NextRequest) {
    const queryParams = request.nextUrl.searchParams;
    const petId = queryParams.get('pet_id');
    if (!petId) {
        return new Response(
            JSON.stringify({ error: "pet_id query parameter is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    console.log(request.body);
    const { data, error } = await supabase.from('poll').select('*').eq('pet', Number(petId)).order('created_at', { ascending: false });

    if (error) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch polls", message: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}
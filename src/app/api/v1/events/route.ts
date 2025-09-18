import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    const body = await request.json();
    const {images, title, description,created_by} = body;
    const { data, error } = await supabase.from('events').insert({
        images, title, description,created_by
    }).select().single();
    if (error) {
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            { status: 400 },
        );
    }

    return new Response(
        JSON.stringify({
            data,
        }),
        { status: 201 },
    );
}

export async function GET() {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (error) {
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            { status: 400 },
        );
    }

    return new Response(
        JSON.stringify({
            data,
        }),
        { status: 200 },
    );
}
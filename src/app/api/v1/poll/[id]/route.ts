import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const pollId = Number(id);
    
    if (Number.isNaN(pollId)) {
        return new Response(
            JSON.stringify({ error: "Invalid poll ID" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const { error } = await supabase.from('poll').delete().eq('id', pollId);

    if (error) {
        return new Response(
            JSON.stringify({ error: "Failed to delete poll", message: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({ message: "Poll deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}
import { supabase } from "@/app/supabase/supabase";
import type { DonationWithDetails } from '@/config/types/donation';
import { createErrorResponse } from "@/lib/db-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }){
    try{
        const { id } = await params;
        const { data, error } = await supabase
            .from('donations')
            .select('*, fundraising(title)')
            .eq('donor', id).order('donated_at', { ascending: false });

        if (error) {
            return createErrorResponse(error.message, 400, (error as Error).message);
        }
        // Flatten fundraising relation to just the title string (or null)
        type FundraisingShape = { title?: string | null } | Array<{ title?: string | null }> | null | undefined;

        const flattened = (data || []).map((donation: DonationWithDetails) => {
            const fundraising = (donation as unknown as { fundraising?: FundraisingShape }).fundraising;
            // If the relation came back as an array (Supabase can return an array for fk selects), pick the first
            const title = Array.isArray(fundraising)
                ? fundraising.length > 0
                    ? fundraising[0]?.title ?? null
                    : null
                : (fundraising as { title?: string | null } | null | undefined)?.title ?? null;

            return {
                ...donation,
                fundraising: title,
            } as DonationWithDetails & { fundraising: string | null };
        });

        return new Response(
            JSON.stringify({
                data: flattened,
            }),
            { status: 200 },
        );
    } catch(err){
        return createErrorResponse('Internal Server Error', 500, (err as Error).message);
    }
}
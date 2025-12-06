import { pushNotification } from "@/app/api/helper";
import { supabaseServer } from "@/app/supabase/supabase-server";
import { NextRequest } from "next/server";


export async function GET(_request: NextRequest) {
    try {
        const supabase = supabaseServer;

        const { data, error } = await supabase
            .from('adoption')
            .select('*, pets(*), users(*)')
            .eq('status', 'APPROVED');

        if (error) {
            console.error('Failed to fetch adoption records:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        if (!data || data.length === 0) {
            return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
        }

        const processed: number[] = [];
        const failed: { id: number; error: string }[] = [];

        const promises = data.map(async (adoption) => {
            if (!adoption.happiness_image && !adoption.followed_up && adoption.user) {
                try {
                    const { error: storeErr } = await supabase.from('notifications').insert({
                        user: adoption.user,
                        title: 'Adoption Follow-up',
                        content: 'How is your new pet doing? Please share a photo with us!',
                    });
                    if (storeErr) throw storeErr;

                    const { error: updateErr } = await supabase
                        .from('adoption')
                        .update({ followed_up: true })
                        .eq('id', adoption.id);
                    if (updateErr) throw updateErr;

                    pushNotification(
                        adoption.user,
                        'Adoption Follow-up',
                        `Hi ${adoption.users?.username ?? 'there'}, how is ${adoption.pets?.name ?? 'your new pet'} doing? Please share a photo with us!`,
                        `https://paws-connect-rho.vercel.app/adoption/${adoption.id}`,
                    ).catch((pushError) =>
                        console.warn(`Push notification failed for adoption ${adoption.id}:`, pushError),
                    );

                    processed.push(adoption.id);
                } catch (err) {
                    console.error(`Failed to process adoption ${adoption.id}:`, err);
                    failed.push({ id: adoption.id, error: String(err) });
                }
            }
        });

        await Promise.allSettled(promises);

        return new Response(
            JSON.stringify({
                success: true,
                data,
                processed,
                failed,
            }),
            { status: 200 },
        );
    } catch (err) {
        console.error('Fatal error in adoption success check:', err);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: String(err),
            }),
            { status: 500 },
        );
    }
}
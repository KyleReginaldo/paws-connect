import { pushNotification, storeNotification } from "@/app/api/helper";
import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    console.log(request.body);
    const {data, error } =  await supabase.from('adoption').select('*').eq('status', 'APPROVED');
    if(error){
        return new Response(JSON.stringify({error: error.message}), {status: 500});
    }
    for(let i=0; i<data.length; i++){
        const adoption = data[i];
        if(!adoption.happiness_image && !adoption.followed_up){
            await  pushNotification(adoption.user!, 'Adoption Follow-up', 'How is your new pet doing? Please share a photo with us!', `https://paws-connect-rho.vercel.app/adoption/${adoption.id}`);
            await storeNotification(adoption.user!, 'Adoption Follow-up', 'How is your new pet doing? Please share a photo with us!');
            await supabase.from('adoption').update({followed_up: true}).eq('id', adoption.id);
        }
    }
    return new Response(JSON.stringify({data}), {status: 200});

}
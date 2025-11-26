import { supabase } from "@/app/supabase/supabase";

export async function GET(){
    const {data, error} = await supabase.from('pets').select('*, photos, adoption(id, status, happiness_image, created_at, user:users(*))').is('adoption', null).order('created_at', {ascending: false});
    if(error){
        return new Response(JSON.stringify({error: error.message}), {status: 500});
    }
    return new Response(JSON.stringify({data}), {status: 200});
}

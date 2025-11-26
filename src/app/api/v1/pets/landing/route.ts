import { supabase } from "@/app/supabase/supabase";

export async function GET(){
    
    const {data, error} = await supabase.from('pets').select('*, photos, adoption(id, status, happiness_image, created_at, user:users(*))').is('adoption', null).order('created_at', {ascending: false}).limit(6);
    if(error){
        return new Response(JSON.stringify({error: error.message}), {status: 500});
    }
    data.forEach((pet) => {
        if(!pet.adoption){
            console.log(`Pet name: ${pet.name} has no adoption record.`);
        }
    });
    return new Response(JSON.stringify({data}), {status: 200});
}
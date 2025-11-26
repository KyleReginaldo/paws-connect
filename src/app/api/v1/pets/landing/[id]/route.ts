import { supabase } from "@/app/supabase/supabase";

export async function GET(request: Request, { params }: { params: Promise<{ id: number }> }){
      const { id } = await params;
      const {data, error} = await supabase.from('pets').select('*, photos, adoption(id, status, happiness_image, created_at, user:users(*))').neq('id', id).is('adoption', null).order('created_at', {ascending: true}).limit(4);
    if(error){
        return new Response(JSON.stringify({error: error.message}), {status: 500});
    }
    return new Response(JSON.stringify({data}), {status: 200});
}
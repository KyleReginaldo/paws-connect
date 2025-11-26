import { supabase } from "@/app/supabase/supabase";

export async function GET(request: Request) {
  console.log(request.url);
  const {data,error} = await supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email),
        donations_count:donations(count),
        all_donations:donations(*)
      `,
      ).eq('status', 'ONGOING')
      .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching fundraising data:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ data }), { status: 200 });
}
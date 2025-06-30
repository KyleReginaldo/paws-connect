import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // For example, fetch data from your DB here
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  if (query) {
    return await searchUsers(query);
  } else {
    const { data, error } = await supabase.from("users").select();
    if (error) {
      return new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      // headers: { "Content-Type": "application/json" },
    });
  }
}
async function searchUsers(query: string): Promise<Response> {
  const { data, error } = await supabase
    .from("users")
    .select()
    .ilike("username", `%${query}%`);
  if (error) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (data.length === 0)
    return new Response(
      JSON.stringify({ error: "Not Found", message: "User not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  // Parse the request body
  const body = await request.json();
  const { username, email, phone_number, password } = body;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
  });
  if (error) {
    return new Response(
      JSON.stringify({ error: "Bad Request", message: error.message }),
      {
        status: 400,
      }
    );
  }
  if (!data.user) {
    return new Response(
      JSON.stringify({ error: "Not found", message: "user not found" }),
      {
        status: 404,
      }
    );
  }
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      id: data.user.id,
      username,
      email,
      phone_number,
      role: 2,
    })
    .select()
    .single();
  if (userError) {
    return new Response(
      JSON.stringify({ error: "Bad Request", message: userError.message }),
      {
        status: 400,
      }
    );
  }

  return new Response(
    JSON.stringify({
      message: "User created successfully",
      data: user,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}

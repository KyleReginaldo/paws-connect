import { supabase } from '@/app/supabase/supabase';
import { UserStatus } from '@/config/enum/user.enum';
import { USER_QUERY_WITH_ID } from '@/config/query/query';
import { createUserSchema } from '@/config/schema/userChema';
import { addUserToGlobalForum } from '@/lib/db-utils';
import axios from 'axios';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const role = searchParams.get('role');

  if (username) {
    return await searchUsers(username, role);
  } else {
    // Get all users or filter by role
    let query = supabase.from('users').select(USER_QUERY_WITH_ID);

    // Add role filter if provided
    if (role) {
      const roleNumber = parseInt(role);
      if (!isNaN(roleNumber)) {
        query = query.eq('role', roleNumber);
      } else {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'Role must be a valid number' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
async function searchUsers(query: string, role?: string | null): Promise<Response> {
  let supabaseQuery = supabase.from('users').select().ilike('username', `%${query}%`);

  // Add role filter if provided
  if (role) {
    const roleNumber = parseInt(role);
    if (!isNaN(roleNumber)) {
      supabaseQuery = supabaseQuery.eq('role', roleNumber);
    } else {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Role must be a valid number' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (data.length === 0) {
    const message = role
      ? `No users found with username containing "${query}" and role ${role}`
      : `User with username containing "${query}" not found`;

    return new Response(JSON.stringify({ error: 'Not Found', message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      message: 'Success',
      data,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null; // Track created auth user for cleanup
  
  try {
    const body = await request.json();

    // Sanitize phone number before validation
    if (body.phone_number) {
      body.phone_number = String(body.phone_number).replace(/\D/g, '');
    }

    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', issues: result.error.message }),
        { status: 400 },
      );
    }

    const parsed = result.data as {
      email: string;
      password?: string;
      username: string;
      phone_number: string;
      role: number;
      created_by?: string;
      status?: UserStatus;
    };
    const { email, username, role } = parsed;
    const phone_number = parsed.phone_number;
    let password = parsed.password;

    // Additional validation after sanitization

    // If no password provided or too weak/short, generate a default strong password
    if (!parsed.password) {
      // Default pattern: 1 upper, 1 lower, 1 digit, 1 symbol + random digits
      const rand = Math.random().toString(36).slice(2, 8);
      password = `A@${rand}1`;
    }
    console.log('Creating user with data:', { email, username, phone_number, role, password });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role,
        username: username,
      },
    });
    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request', message: error.message }), {
        status: 400,
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: 'Not found', message: 'User not found' }), {
        status: 404,
      });
    }

    // Store the created auth user ID for potential cleanup
    createdAuthUserId = data.user.id;

    // Make external API call to create customer
    let externalCustomerId: string | null = null;
    console.log('=== STARTING EXTERNAL API CALL ===');
    try {
      // Format phone number for PayMongo (must be +[area code][10 digits])
      let formattedPhone = phone_number;
      if (phone_number && !phone_number.startsWith('+')) {
        // If phone doesn't start with +, assume it's Philippine number and add +63
        formattedPhone = phone_number.startsWith('09') 
          ? `+63${phone_number.substring(1)}` 
          : `+${phone_number}`;
      }
      // Remove any non-digit characters except the + sign
      formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
      
      console.log('📤 Calling PayMongo API to create customer...');
      console.log('📋 Customer data:', {
        first_name: username,
        last_name: 'NA',
        phone: formattedPhone,
        email: email,
        default_device: 'phone'
      });
      console.log('📋 Original phone:', phone_number);
      console.log('📋 Formatted phone:', formattedPhone);

      const externalApiResponse = await fetch('https://api.paymongo.com/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic c2tfdGVzdF9aQ0xCYldHa0pnVGtmeDVKb0FUbVY5RTE6', // Replace with actual auth header
          // Add other required headers here
        },
        body: JSON.stringify({
          data: {
            attributes: {
              first_name: username, // Using username as first_name for now
              last_name: 'NA', // You can modify this later
              phone: formattedPhone,
              email: email,
              default_device: 'phone',
            },
          },
        }),
      });

      console.log('📨 PayMongo response status:', externalApiResponse.status);
      console.log('📨 PayMongo response headers:', Object.fromEntries(externalApiResponse.headers.entries()));

      if (!externalApiResponse.ok) {
        const errorText = await externalApiResponse.text();
        console.error('❌ External API call failed with status:', externalApiResponse.status);
        console.error('❌ Error response body:', errorText);
        console.error('❌ Error response headers:', Object.fromEntries(externalApiResponse.headers.entries()));
        // Continue with user creation even if external API fails
      } else {
        const externalApiData = await externalApiResponse.json();
        console.log('✅ PayMongo API response:', JSON.stringify(externalApiData, null, 2));
        
        if (externalApiData?.data?.id) {
          externalCustomerId = externalApiData.data.id;
          console.log('✅ External customer created with ID:', externalCustomerId);
        } else {
          console.warn('⚠️ PayMongo API succeeded but no customer ID returned');
          console.warn('⚠️ Full response:', externalApiData);
        }
      }
      
    // Send welcome email (POST to internal send-email endpoint)
    if(parsed.created_by){
      try {
    const emailHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Creation Confirmation</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #fdf2e9;
        margin: 0;
        padding: 30px;
      }
      .container {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        padding: 30px;
        max-width: 600px;
        margin: auto;
        border: 1px solid #fcd9b6;
        text-align: center;
      }
      h1 {
        color: #d35400;
        font-size: 1.9em;
        margin-bottom: 20px;
      }
      p {
        color: #5c5c5c;
        line-height: 1.6;
        margin: 12px 0;
      }
      strong {
        color: #e67e22;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #999999;
        border-top: 1px solid #f1f1f1;
        padding-top: 15px;
      }
      .btn {
        display: inline-block;
        margin-top: 25px;
        background: #e67e22;
        color: #ffffff !important;
        text-decoration: none;
        font-weight: 600;
        padding: 12px 28px;
        border-radius: 8px;
        transition:
          background 0.3s ease,
          transform 0.2s ease;
      }
      .btn:hover {
        background: #ca6f1e;
        transform: translateY(-2px);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Hello ${username},</h1>
      <p>Your account has been successfully created.</p>
      <p>
        <strong>Username:</strong> ${username}<br />
        <strong>Email:</strong> ${email}<br />
        <strong>Password:</strong> ${password}
      </p>
      <p>Please log in and change your password immediately for security reasons.</p>
      <a
        class="btn"
        href="https://paws-connect-sable.vercel.app/signin?email=${email}&password=${password}"
        >Login</a
      >
      <div class="footer">
        <p>Best regards,<br />The Team</p>
      </div>
    </div>
  </body>
</html>
`;

    const emailResponse = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/send-email`, {
      to: email,
      subject: 'Your PawsConnect account has been created',
      text: emailHtml,
    });

    console.log('Email sent response:', emailResponse.data);
    } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Continue with user creation even if email fails
    }
    }
    } catch (externalApiError) {
      console.error('❌ Error calling external API:', externalApiError);
      // Continue with user creation even if external API fails
      // Note: We don't cleanup auth user here as PayMongo failure shouldn't prevent user creation
    }
    
    console.log('=== FINAL EXTERNAL CUSTOMER ID CHECK ===');
    console.log(`🆔 externalCustomerId final value: ${externalCustomerId}`);
    console.log(`🔍 Type of externalCustomerId: ${typeof externalCustomerId}`);
    console.log(`❓ Is null: ${externalCustomerId === null}`);
    console.log(`❓ Is undefined: ${externalCustomerId === undefined}`);
    
    console.log('=== INSERTING USER TO DATABASE ===');
    const insertData = {
      id: data.user.id,
      username,
      email,
      phone_number: `+${phone_number}`,
      role,
      created_by: parsed.created_by,
      status: parsed.role == 1 ?  UserStatus.FULLY_VERIFIED : parsed.status || UserStatus.PENDING,
      paymongo_id: externalCustomerId, // Store the external ID
    };
    console.log('📝 User insert data:', insertData);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (userError) {
      console.error('❌ Database insert error:', userError);
      
      // Cleanup: Delete the auth user since we couldn't create the user profile
      if (createdAuthUserId) {
        try {
          console.log('🧹 Cleaning up: Deleting auth user due to database error...');
          const { error: deleteError } = await supabase.auth.admin.deleteUser(createdAuthUserId);
          if (deleteError) {
            console.error('❌ Failed to cleanup auth user:', deleteError);
          } else {
            console.log('✅ Auth user cleaned up successfully');
          }
        } catch (cleanupError) {
          console.error('❌ Error during auth user cleanup:', cleanupError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'User Creation Failed', 
          message: 'Failed to create user profile. Please try again.' 
        }), 
        { status: 500 }
      );
    }

    console.log('✅ User created successfully in database:', user);
    console.log('🆔 Saved paymongo_id:', user.paymongo_id);

    try {
        const addedToForum = await addUserToGlobalForum(user.id);
        if (addedToForum) {
          console.log('✅ User successfully added to global forum');
        } else {
          console.warn('⚠️ Failed to add user to global forum, but continuing with user creation');
        }
      } catch (forumError) {
        console.error('❌ Error adding user to global forum:', forumError);
      }
    return new Response(JSON.stringify({ message: 'User created successfully', data: user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Unexpected error during user creation:', err);
    
    // If we have a created auth user, try to clean it up
    if (createdAuthUserId) {
      try {
        console.log('🧹 Cleaning up auth user due to unexpected error...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(createdAuthUserId);
        if (deleteError) {
          console.error('❌ Failed to cleanup auth user:', deleteError);
        } else {
          console.log('✅ Auth user cleaned up successfully');
        }
      } catch (cleanupError) {
        console.error('❌ Error during cleanup in catch block:', cleanupError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred while creating the user. Please try again.' 
      }),
      { status: 500 },
    );
  }
}

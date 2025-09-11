import { supabase } from '@/app/supabase/supabase';
import { createErrorResponse, createResponse } from '@/lib/db-utils';
import { NextRequest } from 'next/server';
import { z } from 'zod';

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log(request.url);

  try {
    const { id } = await params;

    // Optimized query - select only necessary fields
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        phone_number,
        profile_image_link,
        house_images,
        payment_method,
        status,
        created_at,
        role
      `)
      .eq('id', id)
      .single();

    if (error) {
      return createErrorResponse('User not found', 404, error.message);
    }

    return createResponse({ message: 'Success', data }, 200, {
      cache: 'private, max-age=300'
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJson(request);
    
    if (!body) {
      return createErrorResponse('Invalid JSON', 400);
    }

    // Validation schema for user updates
    const userUpdateSchema = z
      .object({
        username: z.string().min(1, 'Username cannot be empty').max(50, 'Username too long').optional(),
        email: z.email('Invalid email format').optional(),
        phone_number: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long').optional(),
        profile_image_link: z.url('Invalid URL format').or(z.literal('')).optional(),
        house_images: z.array(z.url('Invalid URL format')).max(10, 'Too many house images').optional(),
        payment_method: z.string().max(50, 'Payment method name too long').optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
      })
      .strict()
      .refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update'
      });

    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const updateData = parsed.data;

    // Handle password update separately if provided
    if (updateData.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        password: updateData.password,
      });

      if (authError) {
        return createErrorResponse('Failed to update password', 400, authError.message);
      }
    }

    // Remove password from profile update
    const { password, ...profileUpdateData } = updateData;

    // Only proceed with profile update if there are fields to update
    if (Object.keys(profileUpdateData).length > 0) {
      // Check if user exists first
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();

      if (existingUserError || !existingUser) {
        return createErrorResponse('User not found', 404);
      }

      // Check for duplicate username if username is being updated
      if (profileUpdateData.username) {
        const { data: duplicateUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', profileUpdateData.username)
          .neq('id', id)
          .single();

        if (duplicateUser) {
          return createErrorResponse('Username already exists', 409);
        }
      }

      // Check for duplicate email if email is being updated
      if (profileUpdateData.email) {
        const { data: duplicateEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', profileUpdateData.email)
          .neq('id', id)
          .single();

        if (duplicateEmail) {
          return createErrorResponse('Email already exists', 409);
        }
      }

      // Update user profile data
      const { data, error } = await supabase
        .from('users')
        .update(profileUpdateData)
        .eq('id', id)
        .select(`
          id,
          username,
          email,
          phone_number,
          profile_image_link,
          house_images,
          payment_method,
          status,
          created_at,
          role,
          role!users_role_fkey (
            id,
            type
          )
        `)
        .single();

      if (error) {
        return createErrorResponse('Failed to update user', 400, error.message);
      }

      return createResponse({ 
        message: 'User updated successfully', 
        data,
        updated_fields: Object.keys(profileUpdateData)
      });
    }

    // If only password was updated
    if (password) {
      return createResponse({ 
        message: 'Password updated successfully',
        updated_fields: ['password']
      });
    }

    return createErrorResponse('No valid fields provided for update', 400);
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log(request.url);
  try {
    const { id } = await params;

    // Check if user exists first
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (existingUserError || !existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // First delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return createErrorResponse('Failed to delete user from auth', 400, authError.message);
    }

    // Then delete from users table
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      return createErrorResponse('Failed to delete user', 400, error.message);
    }

    return createResponse({ message: 'User deleted successfully' });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

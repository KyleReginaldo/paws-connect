import { supabaseServer as supabase } from '@/app/supabase/supabase-server';
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

// Schema for adding violations
const addViolationSchema = z.object({
  violation: z.string().min(1, 'Violation description is required').max(500, 'Violation description too long'),
  admin_id: z.string().uuid('Invalid admin ID'), // ID of the admin adding the violation
});

// Schema for removing violations (optional, for future use)
const removeViolationSchema = z.object({
  violation_index: z.number().min(0, 'Invalid violation index'),
  admin_id: z.string().uuid('Invalid admin ID'),
});

// GET /api/v1/users/[id]/violations - Get user violations (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const adminId = url.searchParams.get('admin_id');

    // Verify admin access
    if (!adminId) {
      return createErrorResponse('Admin ID is required', 401);
    }

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return createErrorResponse('Admin not found', 404);
    }

    // Check if user has admin role (assuming role 1 is admin, adjust as needed)
    if (admin.role !== 1) {
      return createErrorResponse('Access denied. Admin privileges required.', 403);
    }

    // Get user violations
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, violations')
      .eq('id', id)
      .single();

    if (error || !user) {
      return createErrorResponse('User not found', 404);
    }

    return createResponse({
      message: 'User violations retrieved successfully',
      data: {
        user_id: user.id,
        username: user.username,
        violations: user.violations || [],
        violation_count: (user.violations || []).length,
      },
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

// PATCH /api/v1/users/[id]/violations - Add violation to user (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJson(request);

    if (!body) {
      return createErrorResponse('Invalid JSON', 400);
    }

    const parsed = addViolationSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { violation, admin_id } = parsed.data;

    // Verify admin access
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role, username')
      .eq('id', admin_id)
      .single();

    if (adminError || !admin) {
      return createErrorResponse('Admin not found', 404);
    }

    // Check if user has admin role (assuming role 1 is admin, adjust as needed)
    if (admin.role !== 1) {
      return createErrorResponse('Access denied. Admin privileges required.', 403);
    }

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, violations')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return createErrorResponse('User not found', 404);
    }

    // Create new violation entry with timestamp and admin info
    const timestamp = new Date().toISOString();
    const violationEntry = `[${timestamp}] ${violation} (Added by: ${admin.username})`;
    
    // Add the new violation to existing violations array
    const currentViolations = user.violations || [];
    const updatedViolations = [...currentViolations, violationEntry];

    // Update user with new violation
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ violations: updatedViolations })
      .eq('id', id)
      .select('id, username, violations')
      .single();

    if (updateError) {
      return createErrorResponse('Failed to add violation', 400, updateError.message);
    }

    // Log the violation addition for audit purposes
    console.log(`Violation added to user ${id} by admin ${admin_id}: ${violation}`);

    return createResponse({
      message: 'Violation added successfully',
      data: {
        user_id: updatedUser.id,
        username: updatedUser.username,
        violations: updatedUser.violations,
        violation_count: updatedUser.violations?.length || 0,
        added_violation: violationEntry,
      },
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}

// DELETE /api/v1/users/[id]/violations - Remove violation from user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJson(request);

    if (!body) {
      return createErrorResponse('Invalid JSON', 400);
    }

    const parsed = removeViolationSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Validation error', 400, parsed.error.issues);
    }

    const { violation_index, admin_id } = parsed.data;

    // Verify admin access
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role, username')
      .eq('id', admin_id)
      .single();

    if (adminError || !admin) {
      return createErrorResponse('Admin not found', 404);
    }

    // Check if user has admin role (assuming role 1 is admin, adjust as needed)
    if (admin.role !== 1) {
      return createErrorResponse('Access denied. Admin privileges required.', 403);
    }

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, violations')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return createErrorResponse('User not found', 404);
    }

    const currentViolations = user.violations || [];
    
    // Check if violation index is valid
    if (violation_index >= currentViolations.length) {
      return createErrorResponse('Invalid violation index', 400);
    }

    // Remove the violation at the specified index
    const updatedViolations = currentViolations.filter((_, index) => index !== violation_index);

    // Update user with removed violation
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ violations: updatedViolations })
      .eq('id', id)
      .select('id, username, violations')
      .single();

    if (updateError) {
      return createErrorResponse('Failed to remove violation', 400, updateError.message);
    }

    // Log the violation removal for audit purposes
    console.log(`Violation removed from user ${id} by admin ${admin_id}: index ${violation_index}`);

    return createResponse({
      message: 'Violation removed successfully',
      data: {
        user_id: updatedUser.id,
        username: updatedUser.username,
        violations: updatedUser.violations,
        violation_count: updatedUser.violations?.length || 0,
      },
    });
  } catch (err) {
    return createErrorResponse('Internal Server Error', 500, (err as Error).message);
  }
}
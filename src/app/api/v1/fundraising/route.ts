import { supabase } from '@/app/supabase/supabase';
import { createFundraisingSchema } from '@/config/schema/fundraisingSchema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('created_by');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const userRole = searchParams.get('user_role'); // Manual role parameter
    const userId = searchParams.get('user_id'); // Automatic role detection via user lookup

    let query = supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email),
        donations_count:donations(count),
        all_donations:donations(*)
      `,
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Determine user role for filtering
    let effectiveUserRole: number | null = null;

    if (userId) {
      // Automatic role detection: lookup user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        effectiveUserRole = userData.role;
      }
    } else if (userRole) {
      // Manual role parameter
      const roleNum = parseInt(userRole);
      if (!isNaN(roleNum)) {
        effectiveUserRole = roleNum;
      }
    }

    // Role-based status filtering
    if (effectiveUserRole !== null) {
      if (effectiveUserRole === 1) {
        // Admin (role 1) can see all statuses - no additional filtering needed
        if (status) {
          const validStatuses = ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED'];
          if (validStatuses.includes(status)) {
            query = query.eq(
              'status',
              status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
            );
          }
        }
      } else {
        // Regular users (role 3, etc.) can only see ONGOING and COMPLETE
        if (status) {
          // If status is specified, validate it's allowed for regular users
          const allowedStatusesForUsers = ['ONGOING', 'COMPLETE'];
          if (allowedStatusesForUsers.includes(status)) {
            query = query.eq('status', status as 'ONGOING' | 'COMPLETE');
          } else {
            // If user tries to access admin-only statuses, return empty result
            return new Response(
              JSON.stringify({
                message:
                  'Access denied: You can only view ONGOING and COMPLETE fundraising campaigns',
                data: [],
                count: 0,
                pagination: {
                  limit: limit ? parseInt(limit) : null,
                  offset: offset ? parseInt(offset) : null,
                },
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }
        } else {
          // If no status specified, automatically filter to ONGOING and COMPLETE
          query = query.in('status', ['ONGOING', 'COMPLETE']);
        }
      }
    } else {
      // If no role information provided, apply legacy status filtering (backward compatibility)
      if (status) {
        const validStatuses = ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED'];
        if (validStatuses.includes(status)) {
          query = query.eq(
            'status',
            status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
          );
        }
      }
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        query = query.limit(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      if (!isNaN(offsetNum)) {
        query = query.range(offsetNum, offsetNum + (parseInt(limit || '10') - 1));
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: 'Bad Request', message: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Success',
        data,
        count,
        pagination: {
          limit: limit ? parseInt(limit) : null,
          offset: offset ? parseInt(offset) : null,
        },
        filters: {
          applied_role: effectiveUserRole,
          allowed_statuses:
            effectiveUserRole === 1
              ? ['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED']
              : effectiveUserRole !== null
                ? ['ONGOING', 'COMPLETE']
                : 'all',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== FUNDRAISING CREATE START ===');
    
    const contentType = request.headers.get('content-type');
    const isMultipart = contentType?.includes('multipart/form-data');
    
    let formData: {
      title: string;
      description: string;
      created_by: string;
      target_amount: number;
      status?: 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED';
      images?: string[];
      end_date?: string;
      facebook_link?: string;
      qr_code?: string;
      gcash_number?: string;
    };

    if (isMultipart) {
      console.log('� Processing multipart/form-data request');
      const fd = await request.formData();
      
      // Extract text fields
      const title = fd.get('title') as string;
      const description = fd.get('description') as string;
      const created_by = fd.get('created_by') as string;
      const target_amount = Number(fd.get('target_amount'));
      const status = (fd.get('status') as string) || 'PENDING';
      const end_date_raw = fd.get('end_date') as string | null;
      const facebook_link_raw = fd.get('facebook_link') as string | null;
      const gcash_number = fd.get('gcash_number') as string;
      
      // Convert null/empty values to undefined for proper schema validation
      const end_date = end_date_raw && end_date_raw.trim() !== '' ? end_date_raw : undefined;
      const facebook_link = facebook_link_raw && facebook_link_raw.trim() !== '' ? facebook_link_raw : undefined;

      // Process image files
      const imageFiles = fd.getAll('images') as File[];
      const imageUrls: string[] = [];
      
      console.log(`📁 Processing ${imageFiles.length} image files`);
      for (const file of imageFiles) {
        if (file && file.size > 0) {
          console.log(`⬆️ Uploading image: ${file.name}, size: ${file.size} bytes`);
          
          // Validate file
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            return new Response(
              JSON.stringify({
                error: 'File too large',
                message: `Image "${file.name}" exceeds 5MB limit`,
              }),
              { status: 413, headers: { 'Content-Type': 'application/json' } },
            );
          }
          
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({
                error: 'Invalid file type',
                message: `File "${file.name}" must be JPEG, PNG, or WebP`,
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
          }
          
          // Upload to Supabase storage
          const fileName = `fundraising/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
          const fileBuffer = await file.arrayBuffer();
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('files')
            .upload(fileName, fileBuffer, {
              contentType: file.type,
            });
          
          if (uploadError) {
            console.error(`❌ Upload failed for ${file.name}:`, uploadError);
            return new Response(
              JSON.stringify({
                error: 'Upload failed',
                message: `Failed to upload image "${file.name}": ${uploadError.message}`,
              }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            );
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('files')
            .getPublicUrl(uploadData.path);
          
          imageUrls.push(urlData.publicUrl);
          console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);
        }
      }
      
      // Process QR code file
      let qrCodeUrl: string | undefined;
      const qrCodeFile = fd.get('qr_code') as File;
      
      if (qrCodeFile && qrCodeFile.size > 0) {
        console.log(`⬆️ Uploading QR code: ${qrCodeFile.name}, size: ${qrCodeFile.size} bytes`);
        
        // Validate QR code file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (qrCodeFile.size > maxSize) {
          return new Response(
            JSON.stringify({
              error: 'File too large',
              message: `QR code file exceeds 5MB limit`,
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(qrCodeFile.type)) {
          return new Response(
            JSON.stringify({
              error: 'Invalid file type',
              message: `QR code file must be JPEG, PNG, WebP, or GIF`,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        // Upload QR code to Supabase storage
        const qrFileName = `fundraising/qr/${Date.now()}-${Math.random().toString(36).substring(2)}-${qrCodeFile.name}`;
        const qrFileBuffer = await qrCodeFile.arrayBuffer();
        
        const { data: qrUploadData, error: qrUploadError } = await supabase.storage
          .from('files')
          .upload(qrFileName, qrFileBuffer, {
            contentType: qrCodeFile.type,
          });
        
        if (qrUploadError) {
          console.error(`❌ QR code upload failed:`, qrUploadError);
          return new Response(
            JSON.stringify({
              error: 'Upload failed',
              message: `Failed to upload QR code: ${qrUploadError.message}`,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        }
        
        // Get public URL for QR code
        const { data: qrUrlData } = supabase.storage
          .from('files')
          .getPublicUrl(qrUploadData.path);
        
        qrCodeUrl = qrUrlData.publicUrl;
        console.log(`✅ QR code uploaded successfully: ${qrCodeUrl}`);
      }
      
      formData = {
        title,
        description,
        created_by,
        target_amount,
        status: status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
        images: imageUrls,
        end_date,
        facebook_link,
        qr_code: qrCodeUrl,
        gcash_number,
      };
      
    } else {
      console.log('📝 Processing JSON request (backward compatibility)');
      const body = await request.json();
      formData = body;
    }

    console.log('📝 Processed fundraising data:', {
      ...formData,
      images: formData.images ? `${formData.images.length} image(s)` : 'no images',
    });

    const result = createFundraisingSchema.safeParse(formData);
    if (!result.success) {
      console.log('❌ Validation failed:', result.error.issues);
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: 'Please check your input data',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'unknown',
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const validated = result.data;
    
    const insertData = {
      title: validated.title,
      description: validated.description,
      target_amount: validated.target_amount,
      images: validated.images || [],
      raised_amount: 0, // Initialize with 0
      status: validated.status || 'PENDING',
      created_by: validated.created_by,
      end_date: validated.end_date,
      facebook_link: validated.facebook_link,
      qr_code: validated.qr_code,
      gcash_number: validated.gcash_number,
    };

    console.log('💾 Inserting to database:', {
      ...insertData,
      images: insertData.images ? `${insertData.images.length} image(s)` : 'no images',
    });

    const { data, error } = await supabase
      .from('fundraising')
      .insert(insertData)
      .select(
        `
        *,
        created_by_user:users!created_by(username, email)
      `,
      )
      .single();

    if (error) {
      console.log('❌ Database insert error:', error.message);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          message: `Failed to create fundraising campaign: ${error.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    console.log('✅ Successfully created campaign:', data.id);
    console.log('📷 Campaign images saved:', data.images?.length || 0);
    console.log('=== FUNDRAISING CREATE END ===');
    
    return new Response(
      JSON.stringify({
        message: 'Fundraising campaign created successfully',
        data,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('❌ Fundraising POST error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

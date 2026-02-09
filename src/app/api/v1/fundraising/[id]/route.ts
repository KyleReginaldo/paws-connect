import { supabase } from '@/app/supabase/supabase';
import { updateFundraisingSchema } from '@/config/schema/fundraisingSchema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log(request.url);
  try {
    const { id } = await params;
    const fundraisingId = parseInt(id);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('fundraising')
      .select(
        `
        *,
        created_by_user:users!created_by(username, email),
        donations(
          id,
          amount,
          message,
          donated_at,
          reference_number,
          screenshot,
          is_anonymous,
          donor:users(id, username, email)
        )
      `,
      )
      .eq('id', fundraisingId)
      .order('donated_at', { ascending: false, referencedTable: 'donations' })
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Fundraising campaign not found', message: error.message }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'Success', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: (err as Error).message }),
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fundraisingId = parseInt(id);
    console.log('=== FUNDRAISING UPDATE START ===');
    console.log('📝 Updating fundraising ID:', fundraisingId);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), { status: 400 });
    }

    const contentType = request.headers.get('content-type');
    const isMultipart = contentType?.includes('multipart/form-data');
    
    let updateData: {
      title?: string;
      description?: string;
      purpose?: string;
      target_amount?: number;
      status?: 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED';
      images?: string[];
      end_date?: string;
      facebook_link?: string;
      qr_code?: string;
    };

    if (isMultipart) {
      console.log('📤 Processing multipart/form-data request');
      const fd = await request.formData();
      
      // Extract text fields
      const title = fd.get('title') as string;
      const description = fd.get('description') as string;
      const purpose = fd.get('purpose') as string;
      const target_amount = fd.get('target_amount') ? Number(fd.get('target_amount')) : undefined;
      const status = fd.get('status') as string;
      const end_date = fd.get('end_date') as string;
      const facebook_link = fd.get('facebook_link') as string;
      
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
      
      updateData = {
        title: title || undefined,
        description: description || undefined,
        purpose: purpose || undefined,
        target_amount,
        status: status as 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED',
        images: imageUrls.length > 0 ? imageUrls : undefined,
        end_date: end_date || undefined,
        facebook_link: facebook_link || undefined,
        qr_code: qrCodeUrl,
      };
      
    } else {
      console.log('📝 Processing JSON request (backward compatibility)');
      const body = await request.json();
      updateData = body;
    }

    console.log('📝 Processed fundraising update data:', {
      ...updateData,
      images: updateData.images ? `${updateData.images.length} image(s)` : 'unchanged',
    });

    // Remove undefined fields to avoid updating with undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    // Validate the request body
    const result = updateFundraisingSchema.safeParse(cleanUpdateData);
    if (!result.success) {
      console.error('[fundraising PUT] validation failed:', JSON.stringify(result.error.issues));
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: 'Please check your input data',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'unknown',
            message: issue.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log('💾 Updating database with validated data...');
    const { data, error } = await supabase
      .from('fundraising')
      .update(result.data)
      .eq('id', fundraisingId)
      .select(
        `
        *,
        created_by_user:users!created_by(username, email)
      `,
      )
      .single();

    if (error) {
      console.log('❌ Database update error:', error.message);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          message: `Failed to update fundraising campaign: ${error.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    console.log('✅ Successfully updated fundraising campaign:', data.id);
    console.log('📷 Campaign images updated:', data.images?.length || 0);
    console.log('=== FUNDRAISING UPDATE END ===');

    return new Response(
      JSON.stringify({ message: 'Fundraising campaign updated successfully', data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('❌ Fundraising PUT error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log(request.url);
  try {
    const { id } = await params;
    const fundraisingId = parseInt(id);

    if (isNaN(fundraisingId)) {
      return new Response(JSON.stringify({ error: 'Invalid fundraising ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if campaign exists first
    const { data: existing, error: fetchError } = await supabase
      .from('fundraising')
      .select('id, images')
      .eq('id', fundraisingId)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Fundraising campaign not found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Delete associated donations first (foreign key constraint)
    const { error: donationsError } = await supabase
      .from('donations')
      .delete()
      .eq('fundraising', fundraisingId);

    if (donationsError) {
      console.error('❌ Error deleting associated donations:', donationsError.message);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: `Failed to delete associated donations: ${donationsError.message}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Delete the fundraising campaign
    const { error } = await supabase
      .from('fundraising')
      .delete()
      .eq('id', fundraisingId);

    if (error) {
      console.error('❌ Error deleting fundraising campaign:', error.message);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: `Failed to delete fundraising campaign: ${error.message}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log('✅ Successfully deleted fundraising campaign:', fundraisingId);

    return new Response(
      JSON.stringify({ message: 'Fundraising campaign deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('❌ Fundraising DELETE error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}


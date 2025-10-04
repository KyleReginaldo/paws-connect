import { supabase } from '@/app/supabase/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Use Node runtime for server environment access
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('=== EVENT IMAGE UPLOAD START ===');
    
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileInfo = file as File;
    console.log('📄 File info:', {
      name: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type
    });

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!fileInfo.type || !allowedTypes.includes(fileInfo.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.' },
        { status: 400 }
      );
    }

    if (fileInfo.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    if (fileInfo.size < 1024) {
      return NextResponse.json(
        { error: 'File too small. Please upload a valid image.' },
        { status: 400 }
      );
    }

    const SUPABASE_BUCKET = 'files';
    const fileExt = fileInfo.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
    const filePath = `events/${fileName}`;
    
    console.log('📤 Uploading to Supabase:', {
      bucket: SUPABASE_BUCKET,
      filePath: filePath,
      contentType: fileInfo.type
    });

    const arrayBuffer = await fileInfo.arrayBuffer();
    console.log('📊 Array buffer size:', arrayBuffer.byteLength, 'bytes');
    
    const uploadRes = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: fileInfo.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadRes.error) {
      console.error('❌ Supabase upload error:', uploadRes.error.message, uploadRes.error);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadRes.error.message },
        { status: 500 },
      );
    }

    console.log('✅ Upload successful:', uploadRes.data);

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
    console.log('🔗 Public URL generated:', data.publicUrl);
    console.log('=== EVENT IMAGE UPLOAD END ===');
    
    return NextResponse.json({ 
      url: data.publicUrl,
      fileName: fileName,
      originalName: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type
    });
  } catch (err) {
    console.error('Event upload endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
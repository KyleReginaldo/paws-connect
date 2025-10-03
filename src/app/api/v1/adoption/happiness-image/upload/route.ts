import { supabase } from '@/app/supabase/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('=== ADOPTION HAPPINESS IMAGE UPLOAD START ===');
    const formData = await req.formData();
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key, value instanceof File ? `File: ${value.name}` : value]));
    
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      console.log('❌ No file uploaded or invalid file type');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileInfo = file as File;
    console.log('📁 File details:', {
      name: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type,
      lastModified: fileInfo.lastModified
    });

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileInfo.size > MAX_FILE_SIZE) {
      const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
      console.log('❌ File too large:', fileInfo.size, 'bytes', `(${fileSizeMB}MB)`);
      return NextResponse.json({ 
        error: `File too large. "${fileInfo.name}" is ${fileSizeMB}MB. Maximum size is 10MB.` 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileInfo.type)) {
      console.log('❌ Invalid file type:', fileInfo.type);
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    const SUPABASE_BUCKET = 'files'; // change if needed
    const fileExt = fileInfo.name?.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
    const filePath = `adoption-happiness/${fileName}`;
    
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
    console.log('=== ADOPTION HAPPINESS IMAGE UPLOAD END ===');
    
    return NextResponse.json({ 
      url: data.publicUrl,
      fileName: fileName,
      originalName: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type
    });
  } catch (err) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
import { supabase } from '@/app/supabase/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const SUPABASE_BUCKET = 'files'; // Change if needed
    const fileExt = (file as File).name?.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
    const filePath = `pets/${fileName}`;

    // Upload to Supabase
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const uploadRes = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: (file as File).type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadRes.error) {
      console.error('Supabase pets upload error:', uploadRes.error.message, uploadRes.error);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadRes.error.message },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Pets upload endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

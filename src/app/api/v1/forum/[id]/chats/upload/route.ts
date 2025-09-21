import { supabase } from '@/app/supabase/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: unknown) {
  try {
    // Extract forum id from the route context safely.
    const params = (context as unknown as { params: { id: string } }).params;
    const forumId = Number(params?.id);

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const blob = file as File;
    if (!allowed.includes(blob.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    const arrayBuffer = await blob.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const SUPABASE_BUCKET = 'files';
    const fileExt = blob.name?.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
    const filePath = `chat-images/forum-${forumId}/${fileName}`;

    const uploadRes = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadRes.error) {
      console.error('Supabase chat upload error:', uploadRes.error.message, uploadRes.error);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadRes.error.message },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Chat upload endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

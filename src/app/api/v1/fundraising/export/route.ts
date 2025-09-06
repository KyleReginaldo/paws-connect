import { supabase } from '@/app/supabase/supabase';

function mimeToExt(mime: string) {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'bin';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.campaigns)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'campaigns array required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const campaigns = body.campaigns as Array<Record<string, unknown>>;
    const results: Array<Record<string, unknown>> = [];

    for (const c of campaigns) {
      const copy: Record<string, unknown> = { ...c };

      // ensure created_by is plain string when possible
      const createdByRaw = copy['created_by'];
      if (typeof createdByRaw === 'string') copy['created_by'] = createdByRaw;
      else if (createdByRaw && typeof createdByRaw === 'object')
        copy['created_by'] = String((createdByRaw as Record<string, unknown>)['id'] ?? '');

      // process images: only export first image as a public URL
      const imagesRaw = copy['images'];
      let firstImage = '';
      if (Array.isArray(imagesRaw) && imagesRaw.length > 0) {
        firstImage = String(imagesRaw[0] ?? '');
      } else if (typeof imagesRaw === 'string' && imagesRaw) {
        firstImage = imagesRaw as string;
      }

      if (firstImage && firstImage.startsWith('data:')) {
        // data URI -> upload to Supabase storage
        try {
          const match = firstImage.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mime = match[1];
            const b64 = match[2];
            const ext = mimeToExt(mime);
            const buffer = Buffer.from(b64, 'base64');
            const filename = `fundraising/${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}.${ext}`;
            // upload using service role supabase client
            const { error: uploadError } = await supabase.storage
              .from('files')
              .upload(filename, buffer, {
                contentType: mime,
                upsert: false,
              });
            if (!uploadError) {
              const publicUrl = `${
                process.env.NEXT_PUBLIC_SUPABASE_URL
              }/storage/v1/object/public/files/${encodeURIComponent(filename)}`;
              copy['images'] = [publicUrl];
            } else {
              // fallback: remove image
              copy['images'] = [];
            }
          } else {
            copy['images'] = [];
          }
        } catch {
          // on any failure, drop the image so exports don't contain base64
          copy['images'] = [];
        }
      } else if (firstImage) {
        // already a URL or plain string — keep only the first image URL
        copy['images'] = [firstImage];
      } else {
        copy['images'] = [];
      }

      results.push(copy);
    }

    return new Response(JSON.stringify({ message: 'ok', campaigns: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal', message: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

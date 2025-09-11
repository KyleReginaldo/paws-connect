import { supabase } from '@/app/supabase/supabase';
import {
    createFundraisingSchema,
    type CreateFundraisingDto,
} from '@/config/schema/fundraisingSchema';

export async function POST(request: Request) {
  console.log('Bulk fundraising import request received');

  const body = await request.json().catch(() => null);
  if (!body) {
    console.error('Invalid JSON in request body');
    return new Response(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }), {
      status: 400,
    });
  }

  const items = Array.isArray(body) ? body : body.fundraising;
  if (!Array.isArray(items)) {
    console.error('Expected fundraising array, got:', typeof items);
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Expected fundraising array' }),
      { status: 400 },
    );
  }

  console.log(`Processing ${items.length} fundraising items for bulk import`);

  const validItems: CreateFundraisingDto[] = [];
  const errors: { index: number; message: string; data?: unknown }[] = [];
  // find a fallback creator (an admin) to use for items missing created_by
  const { data: adminUsers, error: adminErr } = await supabase
    .from('users')
    .select('id')
    .eq('role', 1)
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultCreatorId = adminErr || !adminUsers ? null : (adminUsers as any).id ?? null;
  if (!defaultCreatorId) {
    console.warn('No admin user found to use as default created_by for imports');
  }

  (items as unknown[]).forEach((p: unknown, idx: number) => {
    // sanitize and add defaults before validation
    const raw = (p as Record<string, unknown>) || {};
    const normalized: Record<string, unknown> = { ...raw };

    // coerce numeric fields often present as strings
    if ('target_amount' in normalized && typeof normalized.target_amount === 'string') {
      const v = Number(normalized.target_amount as string);
      normalized.target_amount = Number.isNaN(v) ? undefined : v;
    }
    
    // IMPORTANT: Reset raised_amount to 0 for imports to prevent data inconsistency
    // Imported campaigns should start with 0 raised amount since no actual donations exist
    if ('raised_amount' in normalized) {
      console.log(`Resetting raised_amount from ${normalized.raised_amount} to 0 for imported campaign`);
      normalized.raised_amount = 0;
    }

    // trim strings
    if (normalized.title) normalized.title = String(normalized.title).trim();
    if (normalized.description) normalized.description = String(normalized.description).trim();

    // normalize images: always coerce into string[] or remove
    if ('images' in normalized && normalized.images != null) {
      const imgs = normalized.images;
      let out: string[] = [];

      if (Array.isArray(imgs)) {
        out = imgs.map((x) => String(x).trim()).filter(Boolean);
      } else if (typeof imgs === 'string') {
        const s = imgs.trim();
        // try JSON parse first
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) out = parsed.map((x) => String(x).trim()).filter(Boolean);
          else if (typeof parsed === 'string') out = [parsed.trim()];
        } catch {
          // fallback: split by common delimiters
          if (s.includes(';'))
            out = s
              .split(';')
              .map((x) => x.trim())
              .filter(Boolean);
          else if (s.includes(','))
            out = s
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean);
          else if (s) out = [s];
        }
      }

      if (out.length > 0) normalized.images = out;
      else delete normalized.images;
    }

    // fill missing created_by with default admin id when possible
    if (!normalized.created_by && defaultCreatorId) normalized.created_by = defaultCreatorId;

    const result = createFundraisingSchema.safeParse(normalized);
    if (!result.success) {
      const errorMsg = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      console.error(`Fundraising ${idx} validation failed:`, errorMsg);
      errors.push({ index: idx, message: errorMsg, data: p });
    } else {
      validItems.push(result.data);
    }
  });

  console.log(`${validItems.length} valid items, ${errors.length} errors`);

  if (validItems.length === 0) {
    console.error('No valid fundraising items to import');
    return new Response(
      JSON.stringify({ message: 'No valid fundraising items to import', created: 0, errors }),
      { status: 400 },
    );
  }

  console.log('Inserting valid fundraising items into database...');
  const { data, error } = await supabase.from('fundraising').insert(validItems).select();
  if (error) {
    console.error('Database insert failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to insert fundraising', message: error.message }),
      { status: 500 },
    );
  }

  console.log(`Successfully inserted ${data?.length || 0} fundraising items`);
  return new Response(
    JSON.stringify({ message: 'Import completed', created: data?.length || 0, data, errors }),
    { status: 201 },
  );
}

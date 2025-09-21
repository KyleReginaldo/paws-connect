import { supabase } from '@/app/supabase/supabase';
import { Pet } from '@/config/types/pet';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/pets/recent - Fetch recently added pets
 *
 * Query Parameters:
 * - limit: Number of pets to return (default: 10, max: 100)
 * - days_back: Number of days to look back for recent pets (default: 7)
 * - request_status: Filter by request status (optional)
 *
 * Examples:
 * - GET /api/v1/pets/recent (last 10 pets from past 7 days)
 * - GET /api/v1/pets/recent?limit=20 (last 20 pets from past 7 days)
 * - GET /api/v1/pets/recent?days_back=30 (last 10 pets from past 30 days)
 * - GET /api/v1/pets/recent?limit=15&days_back=14&request_status=approved
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters with defaults
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10));
    const daysBack = Math.max(1, Number(searchParams.get('days_back')) || 7);
    const requestStatus = searchParams.get('request_status');

    // Calculate the cutoff date for "recent" pets
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffISOString = cutoffDate.toISOString();

    // Build the query
    let query = supabase
      .from('pets')
      .select('*, photo')
      .gte('created_at', cutoffISOString) // Only pets created after cutoff date
      .order('created_at', { ascending: false }) // Most recent first
      .limit(limit);

    // Add request_status filter if provided
    if (requestStatus) {
      query = query.eq('request_status', requestStatus);
    }

  const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch recent pets',
          message: error.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // If a user id was provided, annotate each pet with isFavorite
    const user = request.nextUrl.searchParams.get('user');
    let responseData: (Pet & { isFavorite?: boolean })[] = (data || []) as (Pet & { isFavorite?: boolean })[];
    if (user && Array.isArray(data) && data.length > 0) {
      try {
        const petIds = (data as Array<Pet>).map((p) => p.id).filter(Boolean);
        const { data: favs } = await supabase.from('favorites').select('pet').in('pet', petIds).eq('user', user);
        type FavoriteRow = { pet: number | null };
        const favoriteSet = new Set<number>((favs || []).map((f: FavoriteRow) => f.pet || 0).filter(Boolean));
        responseData = (data as Array<Pet>).map((p) => ({ ...p, isFavorite: favoriteSet.has(p.id) }));
      } catch (e) {
        console.error('Failed to compute favorites for recent pets', e);
      }
    }

    // Calculate additional metadata
    const now = new Date();
    const oldestPetDate =
      responseData && responseData.length > 0 ? new Date(responseData[responseData.length - 1].created_at) : null;

    const actualDaysBack = oldestPetDate
      ? Math.ceil((now.getTime() - oldestPetDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return new Response(
      JSON.stringify({
        message: 'Success',
        data: responseData || [],
        metadata: {
          total_returned: data?.length || 0,
          requested_limit: limit,
          requested_days_back: daysBack,
          actual_days_back: actualDaysBack,
          cutoff_date: cutoffISOString,
          request_status_filter: requestStatus || null,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: (err as Error).message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

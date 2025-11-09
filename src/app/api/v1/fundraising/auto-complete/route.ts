import { supabase } from '@/app/supabase/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /api/v1/fundraising/auto-complete
 * 
 * Automatically completes fundraising campaigns that have reached their end date.
 * This endpoint should be called periodically (e.g., daily via cron job).
 * 
 * Response:
 * - completed: Array of campaign IDs that were completed
 * - failed: Array of campaign IDs that failed to update
 */
export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('🔄 Running auto-complete check for date:', today);

    // Find all ongoing campaigns that have passed their end date
    const { data: expiredCampaigns, error: selectError } = await supabase
      .from('fundraising')
      .select('id, title, end_date, status')
      .eq('status', 'ONGOING')
      .not('end_date', 'is', null)
      .lte('end_date', today);

    if (selectError) {
      console.error('❌ Error fetching expired campaigns:', selectError);
      return NextResponse.json(
        { error: 'Failed to fetch expired campaigns', details: selectError.message },
        { status: 500 }
      );
    }

    if (!expiredCampaigns || expiredCampaigns.length === 0) {
      console.log('✅ No campaigns to complete');
      return NextResponse.json({ 
        message: 'No campaigns to complete',
        completed: [],
        failed: []
      });
    }

    console.log(`📋 Found ${expiredCampaigns.length} expired campaigns:`, 
      expiredCampaigns.map(c => ({ id: c.id, title: c.title, end_date: c.end_date }))
    );

    // Update each expired campaign to COMPLETE status
    const completed: number[] = [];
    const failed: { id: number; error: string }[] = [];

    for (const campaign of expiredCampaigns) {
      try {
        const { error: updateError } = await supabase
          .from('fundraising')
          .update({ status: 'COMPLETE' })
          .eq('id', campaign.id);

        if (updateError) {
          console.error(`❌ Failed to complete campaign ${campaign.id}:`, updateError);
          failed.push({ id: campaign.id, error: updateError.message });
        } else {
          console.log(`✅ Completed campaign ${campaign.id}: ${campaign.title}`);
          completed.push(campaign.id);
        }
      } catch (err) {
        console.error(`❌ Exception completing campaign ${campaign.id}:`, err);
        failed.push({ 
          id: campaign.id, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    const result = {
      message: `Auto-completion check completed. ${completed.length} campaigns completed, ${failed.length} failed.`,
      completed,
      failed: failed.map(f => f.id),
      details: {
        completed_campaigns: expiredCampaigns.filter(c => completed.includes(c.id)),
        failed_campaigns: failed
      }
    };

    console.log('🎯 Auto-completion result:', result);

    return NextResponse.json(result, { status: 200 });

  } catch (err) {
    console.error('❌ Auto-complete error:', err);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/fundraising/auto-complete
 * 
 * Returns information about campaigns that are eligible for auto-completion
 * (for testing/preview purposes)
 */
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: expiredCampaigns, error } = await supabase
      .from('fundraising')
      .select('id, title, end_date, status, target_amount, raised_amount')
      .eq('status', 'ONGOING')
      .not('end_date', 'is', null)
      .lte('end_date', today);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      today,
      eligible_for_completion: expiredCampaigns || [],
      count: expiredCampaigns?.length || 0
    });

  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
import { supabase } from '@/app/supabase/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log(request.url);
  try {
    // Get total campaigns count
    const { count: totalCampaigns, error: totalError } = await supabase
      .from('fundraising')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw totalError;
    }

    // Get campaigns with their status and amounts
    const { data: campaigns, error: campaignsError } = await supabase
      .from('fundraising')
      .select('target_amount, raised_amount, status');

    if (campaignsError) {
      throw campaignsError;
    }

    // Calculate statistics by status
    const pendingCampaigns = campaigns?.filter((c) => c.status === 'PENDING').length || 0;
    const ongoingCampaigns = campaigns?.filter((c) => c.status === 'ONGOING').length || 0;
    const completedCampaigns = campaigns?.filter((c) => c.status === 'COMPLETE').length || 0;
    const rejectedCampaigns = campaigns?.filter((c) => c.status === 'REJECTED').length || 0;
    const cancelledCampaigns = campaigns?.filter((c) => c.status === 'CANCELLED').length || 0;

    // Calculate financial statistics
    const totalRaised =
      campaigns?.reduce((sum, campaign) => sum + (campaign.raised_amount || 0), 0) || 0;
    const totalTarget =
      campaigns?.reduce((sum, campaign) => sum + (campaign.target_amount || 0), 0) || 0;

    // Get recent donations count
    const { count: recentDonations, error: donationsError } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (donationsError) {
      console.warn('Error fetching donations:', donationsError);
    }

    const stats = {
      total_campaigns: totalCampaigns || 0,
      pending_campaigns: pendingCampaigns,
      ongoing_campaigns: ongoingCampaigns,
      completed_campaigns: completedCampaigns,
      rejected_campaigns: rejectedCampaigns,
      cancelled_campaigns: cancelledCampaigns,
      total_raised: totalRaised,
      total_target: totalTarget,
      recent_donations: recentDonations || 0,
      average_donation: totalRaised / Math.max(recentDonations || 1, 1),
      completion_rate: totalTarget > 0 ? (totalRaised / totalTarget) * 100 : 0,
    };

    return new Response(
      JSON.stringify({
        message: 'Success',
        data: stats,
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

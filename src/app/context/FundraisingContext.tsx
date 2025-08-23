'use client';
import { CreateFundraisingDto, UpdateFundraisingDto } from '@/config/schema/fundraisingSchema';
import { Fundraising, FundraisingStats } from '@/config/types/fundraising';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface FundraisingContextType {
  campaigns: Fundraising[] | null;
  stats: FundraisingStats | null;
  status: 'loading' | 'success' | 'error';
  addCampaign: (campaignData: CreateFundraisingDto) => Promise<{
    success: boolean;
    data?: Fundraising;
    error?: string;
  }>;
  updateCampaign: (
    campaignId: number,
    campaignData: UpdateFundraisingDto,
  ) => Promise<{
    success: boolean;
    data?: Fundraising;
    error?: string;
  }>;
  deleteCampaign: (campaignId: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  refreshCampaigns: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const FundraisingContext = createContext<FundraisingContextType | undefined>(undefined);

export function useFundraising() {
  const context = useContext(FundraisingContext);
  if (context === undefined) {
    throw new Error('useFundraising must be used within a FundraisingProvider');
  }
  return context;
}

interface FundraisingProviderProps {
  children: ReactNode;
}

export function FundraisingProvider({ children }: FundraisingProviderProps) {
  const [campaigns, setCampaigns] = useState<Fundraising[] | null>(null);
  const [stats, setStats] = useState<FundraisingStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const fetchCampaigns = async (searchParams?: URLSearchParams) => {
    try {
      setStatus('loading');
      const url = new URL('/api/v1/fundraising', window.location.origin);
      if (searchParams) {
        searchParams.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const result = await response.json();
      setCampaigns(result.data || []);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setStatus('error');
      setCampaigns([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/fundraising/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  };

  const addCampaign = async (
    campaignData: CreateFundraisingDto,
  ): Promise<{
    success: boolean;
    data?: Fundraising;
    error?: string;
  }> => {
    try {
      const response = await fetch('/api/v1/fundraising', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to create campaign',
        };
      }

      const result = await response.json();
      const newCampaign = result.data;

      setCampaigns((prevCampaigns) => {
        if (!prevCampaigns) return [newCampaign];
        return [newCampaign, ...prevCampaigns];
      });

      // Refresh stats
      await fetchStats();

      return {
        success: true,
        data: newCampaign,
      };
    } catch (error) {
      console.error('Error adding campaign:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating the campaign',
      };
    }
  };

  const updateCampaign = async (
    campaignId: number,
    campaignData: UpdateFundraisingDto,
  ): Promise<{
    success: boolean;
    data?: Fundraising;
    error?: string;
  }> => {
    try {
      const response = await fetch(`/api/v1/fundraising/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to update campaign',
        };
      }

      const result = await response.json();
      const updatedCampaign = result.data;

      setCampaigns((prevCampaigns) => {
        if (!prevCampaigns) return null;
        return prevCampaigns.map((campaign) =>
          campaign.id === campaignId ? updatedCampaign : campaign,
        );
      });

      // Refresh stats
      await fetchStats();

      return {
        success: true,
        data: updatedCampaign,
      };
    } catch (error) {
      console.error('Error updating campaign:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while updating the campaign',
      };
    }
  };

  const deleteCampaign = async (
    campaignId: number,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await fetch(`/api/v1/fundraising/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to delete campaign',
        };
      }

      setCampaigns((prevCampaigns) => {
        if (!prevCampaigns) return null;
        return prevCampaigns.filter((campaign) => campaign.id !== campaignId);
      });

      // Refresh stats
      await fetchStats();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the campaign',
      };
    }
  };

  const refreshCampaigns = async () => {
    await fetchCampaigns();
  };

  const refreshStats = async () => {
    await fetchStats();
  };

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const value: FundraisingContextType = {
    campaigns,
    stats,
    status,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    refreshCampaigns,
    refreshStats,
  };

  return <FundraisingContext.Provider value={value}>{children}</FundraisingContext.Provider>;
}

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

  // Helper to extract an error message from unknown response bodies
  const extractErrorMessage = (errorData: unknown, fallback = 'An error occurred'): string => {
    if (!errorData) return fallback;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData === 'object') {
      const obj = errorData as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.error === 'string') return obj.error;
      if (Array.isArray(obj.issues)) {
        try {
          return obj.issues
            .map((i: unknown) => {
              if (typeof i === 'string') return i;
              const ii = i as Record<string, unknown>;
              const field = ii.field ?? ii.path ?? '';
              const message = ii.message ?? '';
              return `${field}: ${message}`;
            })
            .join('; ');
        } catch {
          return fallback;
        }
      }
      return JSON.stringify(obj);
    }
    return fallback;
  };

  const addCampaign = async (
    campaignData: CreateFundraisingDto,
  ): Promise<{
    success: boolean;
    data?: Fundraising;
    error?: string;
  }> => {
    try {
      // Sanitize numeric fields that may be strings from the UI
      const payload = { ...campaignData } as Record<string, unknown>;
      if ('target_amount' in payload) {
        const val = payload['target_amount'];
        if (typeof val === 'string' && val !== '') {
          const n = Number(val);
          if (!Number.isNaN(n)) payload['target_amount'] = n;
          else delete payload['target_amount'];
        }
      }

      if ('raised_amount' in payload) {
        const val = payload['raised_amount'];
        if (typeof val === 'string' && val !== '') {
          const n = Number(val);
          if (!Number.isNaN(n)) payload['raised_amount'] = n;
          else delete payload['raised_amount'];
        }
      }

      const response = await fetch('/api/v1/fundraising', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData: unknown = { message: 'Failed to create campaign' };
        try {
          errorData = await response.json();
        } catch (err) {
          console.error('Failed to parse error response for addCampaign:', err);
        }

        const errMessage = extractErrorMessage(errorData, 'Failed to create campaign');

        return {
          success: false,
          error: errMessage,
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
      // Sanitize numeric fields that may be strings from the UI
      const payload = { ...campaignData } as Record<string, unknown>;
      if ('target_amount' in payload) {
        const val = payload['target_amount'];
        if (typeof val === 'string' && val !== '') {
          const n = Number(val);
          if (!Number.isNaN(n)) payload['target_amount'] = n;
          else delete payload['target_amount'];
        }
      }

      if ('raised_amount' in payload) {
        const val = payload['raised_amount'];
        if (typeof val === 'string' && val !== '') {
          const n = Number(val);
          if (!Number.isNaN(n)) payload['raised_amount'] = n;
          else delete payload['raised_amount'];
        }
      }

      const response = await fetch(`/api/v1/fundraising/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData: unknown = { message: 'Failed to update campaign' };
        try {
          errorData = await response.json();
        } catch (err) {
          console.error('Failed to parse error response for updateCampaign:', err);
        }

        const errMessage = extractErrorMessage(errorData, 'Failed to update campaign');

        return {
          success: false,
          error: errMessage,
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
        let errorData: unknown = { message: 'Failed to delete campaign' };
        try {
          errorData = await response.json();
        } catch (err) {
          console.error('Failed to parse error response for deleteCampaign:', err);
        }

        const errMessage = extractErrorMessage(errorData, 'Failed to delete campaign');

        return {
          success: false,
          error: errMessage,
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

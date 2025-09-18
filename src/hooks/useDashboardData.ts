'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string | null;
  gender: string | null;
  age: number | null;
  size: string | null;
  weight: string | null;
  health_status: string | null;
  request_status: string | null;
  is_vaccinated: boolean | null;
  is_spayed_or_neutured: boolean | null;
  is_trained: boolean | null;
  good_with: string[] | null;
  description: string | null;
  photo: string | null;
  rescue_address: string | null;
  added_by: string | null;
  created_at: string;
  date_of_birth: string | null;
  color: string | null;
  special_needs: string | null;
}

export interface User {
  id: string;
  username: string | null;
  email: string | null;
  phone_number: string;
  role: number;
  status: string | null;
  profile_image_link: string | null;
  created_at: string;
  created_by: string | null;
  password_changed: boolean | null;
  payment_method: string | null;
  paymongo_id: string | null;
  house_images: string[] | null;
}

export interface FundraisingCampaign {
  id: number;
  title: string | null;
  description: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  status: 'PENDING' | 'ONGOING' | 'COMPLETE' | 'REJECTED' | 'CANCELLED' | null;
  images: string[] | null;
  created_by: string | null;
  created_at: string;
  end_date: string | null;
  facebook_link: string | null;
  created_by_user?: {
    username: string | null;
    email: string | null;
  };
  donations_count?: Array<{ count: number }>;
}

export interface Adoption {
  id: number;
  user: string | null;
  pet: number | null;
  created_at: string;
  has_children_in_home: boolean | null;
  has_other_pets_in_home: boolean | null;
  have_outdoor_space: boolean | null;
  have_permission_from_landlord: boolean | null;
  is_renting: boolean | null;
  number_of_household_members: number | null;
  type_of_residence: string | null;
}

export interface DashboardStats {
  totalPets: number;
  totalAdoptions: number;
  totalDonations: number;
  totalUsers: number;
  availablePets: number;
  adoptedPets: number;
  pendingPets: number;
  medicalPets: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
}

export interface ChartDataPoint {
  period: string;
  [key: string]: string | number;
}

const useDashboardData = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [petsResponse, usersResponse, campaignsResponse, adoptionsResponse] = await Promise.all([
        fetch('/api/v1/pets'),
        fetch('/api/v1/users'),
        fetch('/api/v1/fundraising'),
        fetch('/api/v1/adoption'),
      ]);

      // Check if all requests were successful
      if (!petsResponse.ok) throw new Error(`Pets API error: ${petsResponse.status}`);
      if (!usersResponse.ok) throw new Error(`Users API error: ${usersResponse.status}`);
      if (!campaignsResponse.ok) throw new Error(`Campaigns API error: ${campaignsResponse.status}`);
      if (!adoptionsResponse.ok) throw new Error(`Adoptions API error: ${adoptionsResponse.status}`);

      // Parse JSON responses
      const petsData = await petsResponse.json();
      const usersData = await usersResponse.json();
      const campaignsData = await campaignsResponse.json();
      const adoptionsData = await adoptionsResponse.json();

      // Update state with fetched data
      setPets(petsData.data || []);
      setUsers(usersData.data || []);
      setCampaigns(campaignsData.data || []);
      setAdoptions(adoptionsData.data || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalPets: pets.length,
    totalAdoptions: adoptions.length,
    totalDonations: campaigns.reduce((sum, campaign) => sum + (campaign.raised_amount || 0), 0),
    totalUsers: users.length,
    availablePets: pets.filter((pet) => pet.request_status === 'available').length,
    adoptedPets: pets.filter((pet) => pet.request_status === 'adopted').length,
    pendingPets: pets.filter((pet) => pet.request_status === 'pending').length,
    medicalPets: pets.filter((pet) => pet.request_status === 'medical').length,
    activeCampaigns: campaigns.filter((campaign) => campaign.status === 'ONGOING').length,
    completedCampaigns: campaigns.filter((campaign) => campaign.status === 'COMPLETE').length,
    pendingCampaigns: campaigns.filter((campaign) => campaign.status === 'PENDING').length,
  };

  // Generate chart data for different time periods
  const generateChartData = (period: 'weekly' | 'monthly' | 'annual') => {
    const now = new Date();
    
    if (period === 'weekly') {
      // Generate last 4 weeks data
      const weeklyData: ChartDataPoint[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7 + 7));
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));
        
        const weekPets = pets.filter(pet => {
          const petDate = new Date(pet.created_at);
          return petDate >= weekStart && petDate <= weekEnd;
        });
        
        const weekUsers = users.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate >= weekStart && userDate <= weekEnd;
        });
        
        const weekCampaigns = campaigns.filter(campaign => {
          const campaignDate = new Date(campaign.created_at);
          return campaignDate >= weekStart && campaignDate <= weekEnd;
        });

        weeklyData.push({
          period: `Week ${4 - i}`,
          pets: weekPets.length,
          dogs: weekPets.filter(p => p.type.toLowerCase().includes('dog')).length,
          cats: weekPets.filter(p => p.type.toLowerCase().includes('cat')).length,
          users: weekUsers.length,
          newUsers: weekUsers.length,
          donations: weekCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0),
          campaigns: weekCampaigns.length,
          total: weekPets.length,
        });
      }
      return weeklyData;
    }
    
    if (period === 'monthly') {
      // Generate last 6 months data
      const monthlyData: ChartDataPoint[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthPets = pets.filter(pet => {
          const petDate = new Date(pet.created_at);
          return petDate >= monthDate && petDate < nextMonthDate;
        });
        
        const monthUsers = users.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate >= monthDate && userDate < nextMonthDate;
        });
        
        const monthCampaigns = campaigns.filter(campaign => {
          const campaignDate = new Date(campaign.created_at);
          return campaignDate >= monthDate && campaignDate < nextMonthDate;
        });

        monthlyData.push({
          period: months[monthDate.getMonth()],
          pets: monthPets.length,
          dogs: monthPets.filter(p => p.type.toLowerCase().includes('dog')).length,
          cats: monthPets.filter(p => p.type.toLowerCase().includes('cat')).length,
          users: monthUsers.length,
          newUsers: monthUsers.length,
          donations: monthCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0),
          campaigns: monthCampaigns.length,
          total: monthPets.length,
        });
      }
      return monthlyData;
    }
    
    // Annual data - last 3 years
    const annualData: ChartDataPoint[] = [];
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year + 1, 0, 1);
      
      const yearPets = pets.filter(pet => {
        const petDate = new Date(pet.created_at);
        return petDate >= yearStart && petDate < yearEnd;
      });
      
      const yearUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate >= yearStart && userDate < yearEnd;
      });
      
      const yearCampaigns = campaigns.filter(campaign => {
        const campaignDate = new Date(campaign.created_at);
        return campaignDate >= yearStart && campaignDate < yearEnd;
      });

      annualData.push({
        period: year.toString(),
        pets: yearPets.length,
        dogs: yearPets.filter(p => p.type.toLowerCase().includes('dog')).length,
        cats: yearPets.filter(p => p.type.toLowerCase().includes('cat')).length,
        users: yearUsers.length,
        newUsers: yearUsers.length,
        donations: yearCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0),
        campaigns: yearCampaigns.length,
        total: yearPets.length,
      });
    }
    return annualData;
  };

  // Generate recent activity data
  const generateRecentActivity = () => {
    const recentItems: Array<{
      id: string;
      type: 'adoption' | 'donation' | 'user' | 'pet';
      title: string;
      subtitle: string;
      time: string;
    }> = [];

    // Recent pets (last 5)
    const recentPets = pets
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    recentPets.forEach(pet => {
      recentItems.push({
        id: `pet-${pet.id}`,
        type: 'pet',
        title: 'New pet added',
        subtitle: `${pet.name} - ${pet.breed || pet.type}`,
        time: pet.created_at,
      });
    });

    // Recent users (last 3)
    const recentUsers = users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    
    recentUsers.forEach(user => {
      recentItems.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New user registered',
        subtitle: user.email || user.username || 'Unknown user',
        time: user.created_at,
      });
    });

    // Recent campaigns (last 2)
    const recentCampaigns = campaigns
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    
    recentCampaigns.forEach(campaign => {
      recentItems.push({
        id: `campaign-${campaign.id}`,
        type: 'donation',
        title: 'New fundraising campaign',
        subtitle: campaign.title || 'Untitled campaign',
        time: campaign.created_at,
      });
    });

    // Sort by time (most recent first) and return top 8
    return recentItems
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  };

  // Generate recent adoptions data
  const generateRecentAdoptions = () => {
    return adoptions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(adoption => {
        const pet = pets.find(p => p.id === adoption.pet);
        const user = users.find(u => u.id === adoption.user);
        
        return {
          id: adoption.id,
          petName: pet?.name || 'Unknown Pet',
          petType: pet?.breed || pet?.type || 'Unknown Type',
          adopter: user?.username || user?.email || 'Unknown User',
          timeAgo: formatTimeAgo(adoption.created_at),
          status: Math.random() > 0.5 ? 'completed' : 'pending', // Placeholder logic
          image: pet?.photo || '/empty_pet.png',
        };
      });
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1 week ago';
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    return date.toLocaleDateString();
  };

  return {
    // Raw data
    pets,
    users,
    campaigns,
    adoptions,
    
    // Loading states
    loading,
    error,
    
    // Computed data
    stats,
    
    // Functions for generating dynamic data
    generateChartData,
    generateRecentActivity,
    generateRecentAdoptions,
    
    // Utility
    refetch: fetchData,
  };
};

export default useDashboardData;
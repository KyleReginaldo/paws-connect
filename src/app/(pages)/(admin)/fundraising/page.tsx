'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useFundraising } from '@/app/context/FundraisingContext';
import { FundraisingModal } from '@/components/FundraisingModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CreateFundraisingDto, UpdateFundraisingDto } from '@/config/schema/fundraisingSchema';
import { type Fundraising, type FundraisingStatus } from '@/config/types/fundraising';
import {
  DollarSign,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const Fundraising = () => {
  const { campaigns, stats, status, deleteCampaign, updateCampaign, addCampaign } =
    useFundraising();
  const { userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Fundraising | null>(null);

  const handleDelete = async (campaignId: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setIsDeleting(campaignId);
      const result = await deleteCampaign(campaignId);
      if (result.success) {
        console.log('Campaign deleted successfully');
      } else {
        alert(result.error || 'Failed to delete campaign.');
      }
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (campaignId: number, newStatus: FundraisingStatus) => {
    const result = await updateCampaign(campaignId, { status: newStatus });
    if (result.success) {
      console.log('Campaign status updated successfully');
    } else {
      alert(result.error || 'Failed to update campaign status.');
    }
  };

  const handleModalSubmit = async (campaignData: CreateFundraisingDto | UpdateFundraisingDto) => {
    if (editingCampaign) {
      // Update existing campaign
      const result = await updateCampaign(editingCampaign.id, campaignData as UpdateFundraisingDto);
      return {
        success: result.success,
        error: result.error,
      };
    } else {
      // Create new campaign
      const result = await addCampaign(campaignData as CreateFundraisingDto);
      return {
        success: result.success,
        error: result.error,
      };
    }
  };

  const handleEditClick = (campaign: Fundraising) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleNewCampaignClick = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  // Filter campaigns based on search query
  const filteredCampaigns =
    campaigns?.filter(
      (campaign) =>
        campaign.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETE':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'ONGOING':
        return 'Ongoing';
      case 'COMPLETE':
        return 'Complete';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading campaigns...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold mb-2">Failed to load campaigns</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Fundraising Campaigns</h1>
        <p className="text-lg text-muted-foreground">
          Manage and track all fundraising campaigns for animal welfare.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₱{(stats?.total_raised || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.ongoing_campaigns || 0}</p>
                <p className="text-sm text-muted-foreground">Ongoing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completed_campaigns || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending_campaigns || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2" onClick={handleNewCampaignClick}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{campaign.title}</CardTitle>
                  <CardDescription className="text-sm">{campaign.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusLabel(campaign.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isDeleting === campaign.id}>
                        {isDeleting === campaign.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditClick(campaign)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {campaign.status === 'PENDING' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(campaign.id, 'ONGOING')}
                        >
                          Approve & Start
                        </DropdownMenuItem>
                      )}
                      {campaign.status === 'ONGOING' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(campaign.id, 'COMPLETE')}
                        >
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    ₱{(campaign.raised_amount || 0).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    ₱{(campaign.target_amount || 0).toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    campaign.target_amount
                      ? ((campaign.raised_amount || 0) / campaign.target_amount) * 100
                      : 0
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {campaign.target_amount
                    ? Math.round(((campaign.raised_amount || 0) / campaign.target_amount) * 100)
                    : 0}
                  % of goal reached
                </p>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No campaigns found' : 'No campaigns yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `No campaigns match "${searchQuery}"`
              : 'Start your first fundraising campaign to help animals in need'}
          </p>
          {searchQuery ? (
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          ) : (
            <Button className="gap-2" onClick={handleNewCampaignClick}>
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          )}
        </div>
      )}

      {/* Fundraising Modal */}
      <FundraisingModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onSubmit={handleModalSubmit}
        editingCampaign={editingCampaign}
        currentUserId={userId}
      />
    </div>
  );
};

export default Fundraising;

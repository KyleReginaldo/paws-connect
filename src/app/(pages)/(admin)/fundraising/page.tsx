'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useFundraising } from '@/app/context/FundraisingContext';
import { FundraisingModal } from '@/components/FundraisingModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { useConfirmation } from '@/components/ui/confirmation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateFundraisingDto, UpdateFundraisingDto } from '@/config/schema/fundraisingSchema';
import { type Fundraising, type FundraisingStatus } from '@/config/types/fundraising';
import { CardListSkeleton } from '@/components/ui/skeleton-patterns';
import {
  DollarSign,
  Download,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const Fundraising = () => {
  const { campaigns, stats, status, deleteCampaign, updateCampaign, addCampaign } =
    useFundraising();
  const { userId } = useAuth();
  const { success, error, warning, info } = useNotifications();
  const { confirm } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Fundraising | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDelete = async (campaignId: number) => {
    const confirmed = await confirm({
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      confirmVariant: 'destructive',
    });

    if (confirmed) {
      setIsDeleting(campaignId);
      const result = await deleteCampaign(campaignId);
      if (result.success) {
        success('Campaign Deleted', 'The campaign has been successfully deleted.');
      } else {
        error('Delete Failed', result.error || 'Failed to delete campaign.');
      }
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (campaignId: number, newStatus: FundraisingStatus) => {
    const result = await updateCampaign(campaignId, { status: newStatus });
    if (result.success) {
      success('Status Updated', `Campaign status has been changed to ${newStatus.toLowerCase()}.`);
    } else {
      error('Update Failed', result.error || 'Failed to update campaign status.');
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

  // Filter campaigns based on search query and active tab status
  const filteredCampaigns =
    campaigns?.filter((campaign) => {
      if (activeStatus !== 'ALL' && campaign.status !== activeStatus) return false;
      if (!searchQuery) return true;
      return (
        campaign.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }) || [];

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
    return <CardListSkeleton />;
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

  const handleExport = () => {
    if (!campaigns) return;
    // Excel has a cell text length limit (~32767). Truncate any overly long text
    const MAX_CELL_LENGTH = 32767;
    const truncate = (v: unknown) => {
      if (v == null) return '';
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return s.length > MAX_CELL_LENGTH ? s.slice(0, MAX_CELL_LENGTH - 4) + ' ...' : s;
    };

    // Ask server to sanitize campaigns (upload data URIs) so exports only contain URLs
    fetch('/api/v1/fundraising/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaigns }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Export prep failed');
        const payload = await r.json().catch(() => null);
        const prepared =
          payload && Array.isArray(payload.campaigns) ? payload.campaigns : campaigns;

        const exportData = (prepared as typeof campaigns).map((c) => {
          const createdByRaw = (c as unknown as Record<string, unknown>)['created_by'];
          let createdBy = '';
          if (typeof createdByRaw === 'string') createdBy = createdByRaw;
          else if (createdByRaw && typeof createdByRaw === 'object')
            createdBy = String((createdByRaw as Record<string, unknown>)['id'] ?? '');

          const imageUrl =
            Array.isArray(c.images) && c.images.length > 0 ? String(c.images[0]) : '';

          const row: Record<string, unknown> = {
            id: c.id,
            title: truncate(c.title),
            description: truncate(c.description),
            target_amount: c.target_amount,
            raised_amount: c.raised_amount, // Note: Will be reset to 0 when imported
            status: c.status,
            created_at: c.created_at,
            created_by: createdBy,
            images: truncate(imageUrl),
          };

          Object.keys(c).forEach((k) => {
            if (row[k] !== undefined) return;
            const val = (c as unknown as Record<string, unknown>)[k];
            row[k] = truncate(val);
          });

          return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'fundraising');
        XLSX.writeFile(workbook, 'fundraising.xlsx');

        // Inform user about import behavior
        info(
          'Export Completed',
          'When you re-import this file, all raised_amount values will be reset to ₱0. This prevents data inconsistency since donation records are not exported.',
          8000,
        );
      })
      .catch(() => {
        // fallback local export: strip data URIs and keep only first URL
        const exportData = campaigns.map((c) => {
          const createdByRaw = (c as unknown as Record<string, unknown>)['created_by'];
          let createdBy = '';
          if (typeof createdByRaw === 'string') createdBy = createdByRaw;
          else if (createdByRaw && typeof createdByRaw === 'object')
            createdBy = String((createdByRaw as Record<string, unknown>)['id'] ?? '');

          const imageUrl =
            Array.isArray(c.images) && c.images.length > 0 ? String(c.images[0]) : '';

          const row: Record<string, unknown> = {
            id: c.id,
            title: truncate(c.title),
            description: truncate(c.description),
            target_amount: c.target_amount,
            raised_amount: c.raised_amount,
            status: c.status,
            created_at: c.created_at,
            created_by: createdBy,
            images: truncate(imageUrl.startsWith('data:') ? '' : imageUrl),
          };

          Object.keys(c).forEach((k) => {
            if (row[k] !== undefined) return;
            const val = (c as unknown as Record<string, unknown>)[k];
            row[k] = truncate(val);
          });

          return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'fundraising');
        XLSX.writeFile(workbook, 'fundraising.xlsx');

        // Inform user about import behavior (fallback export)
        info(
          'Export Completed',
          'When you re-import this file, all raised_amount values will be reset to ₱0. This prevents data inconsistency since donation records are not exported.',
          8000,
        );
      });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Warn user about raised_amount reset
    const confirmed = await confirm({
      title: 'Import Fundraising Campaigns',
      message:
        'IMPORTANT: When importing fundraising campaigns, the raised_amount will be reset to ₱0 for all campaigns.\n\nThis prevents data inconsistency since the actual donation records are not imported.\n\nDo you want to continue with the import?',
      type: 'warning',
      confirmText: 'Continue Import',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      // Reset file input
      e.target.value = '';
      return;
    }
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    // Normalize and map spreadsheet headers to the API shape:
    // - convert header names to lowercase_snake_case
    // - coerce numeric fields
    // - set created_by to current userId when missing
    // - normalize status to uppercase enum values
    const normalized = rows.map((r) => {
      const mapped: Record<string, unknown> = {};
      // map keys
      Object.keys(r).forEach((k) => {
        const rawKey = String(k || '').trim();
        const key = rawKey
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        mapped[key] = (r as Record<string, unknown>)[k];
      });

      // coerce numeric fields
      if ('target_amount' in mapped && typeof mapped.target_amount === 'string') {
        const v = Number(mapped.target_amount as string);
        mapped.target_amount = Number.isNaN(v) ? undefined : v;
      }
      if ('raised_amount' in mapped && typeof mapped.raised_amount === 'string') {
        const v = Number(mapped.raised_amount as string);
        mapped.raised_amount = Number.isNaN(v) ? undefined : v;
      }

      // trim strings
      if ('title' in mapped && mapped.title != null) mapped.title = String(mapped.title).trim();
      if ('description' in mapped && mapped.description != null)
        mapped.description = String(mapped.description).trim();

      // normalize status
      if ('status' in mapped && typeof mapped.status === 'string')
        mapped.status = String(mapped.status).trim().toUpperCase();

      // set created_by to current user if missing
      if (!mapped.created_by && userId) mapped.created_by = userId;

      return mapped as Record<string, unknown>;
    });

    try {
      const res = await fetch('/api/v1/fundraising/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundraising: normalized }),
      });
      const resultRaw = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const parsed = resultRaw as { errors?: unknown; message?: string } | null;
        error('Import Failed', parsed?.message || 'Import failed. Check console for details.');
        const details = parsed ? (parsed.errors ?? parsed) : 'No details';
        console.error('Import errors:', details);
      } else {
        const parsed = resultRaw as { errors?: unknown[]; created?: number } | null;
        const errorsCount = parsed && Array.isArray(parsed.errors) ? parsed.errors.length : 0;
        const created = parsed?.created || 0;

        if (errorsCount > 0) {
          warning(
            'Import Completed with Errors',
            `Imported ${created} items successfully. ${errorsCount} items had errors.`,
            8000,
          );
        } else {
          success(
            'Import Successful',
            `Successfully imported ${created} fundraising campaigns.`,
            6000,
          );
        }
        // Refresh data by reloading the page
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      console.error('Import failed', err);
      error('Import Error', 'Import failed due to an unexpected error. Check console for details.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  ₱{(stats?.total_raised || 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {stats?.ongoing_campaigns || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Ongoing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {stats?.completed_campaigns || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {stats?.pending_campaigns || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
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
        <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={handleNewCampaignClick}>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="rounded-full px-3 shadow-sm hover:shadow-md"
              title="Export campaigns"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              variant="default"
              size="sm"
              onClick={handleImportClick}
              className="rounded-full px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 shadow-sm"
              title="Import campaigns"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="ALL" onValueChange={(v) => setActiveStatus(v)} className="mb-6">
        <TabsList>
          <TabsTrigger value="ALL">All ({campaigns?.length || 0})</TabsTrigger>
          <TabsTrigger value="PENDING">Pending ({stats?.pending_campaigns || 0})</TabsTrigger>
          <TabsTrigger value="ONGOING">Ongoing ({stats?.ongoing_campaigns || 0})</TabsTrigger>
          <TabsTrigger value="COMPLETE">Complete ({stats?.completed_campaigns || 0})</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <Link href={`/fundraising/${campaign.id}`} className="block">
              <div className="relative">
                {campaign.images && campaign.images.length > 0 ? (
                  <div className="w-full h-32 sm:h-36 md:h-44 bg-gray-100 relative overflow-hidden">
                    <Image
                      src={String(campaign.images[0])}
                      alt={campaign.images[0] || 'campaign image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 sm:h-36 md:h-44 bg-muted-foreground/10 flex items-center justify-center">
                    <div className="text-muted-foreground text-xs sm:text-sm">No image</div>
                  </div>
                )}
                <div className="absolute left-2 sm:left-4 bottom-2 sm:bottom-3 bg-gradient-to-r from-black/60 to-transparent text-white rounded-md px-2 sm:px-3 py-1 sm:py-2">
                  <div className="text-xs sm:text-sm font-semibold line-clamp-1">
                    {campaign.title}
                  </div>
                  <div className="text-xs opacity-90 hidden sm:block">
                    ₱{(campaign.raised_amount || 0).toLocaleString()} · ₱
                    {(campaign.target_amount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="absolute right-2 sm:right-3 top-2 sm:top-3">
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusLabel(campaign.status)}
                  </Badge>
                </div>
              </div>
            </Link>

            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">
                {campaign.description}
              </CardDescription>
              <div>
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <Progress
                      value={
                        campaign.target_amount
                          ? ((campaign.raised_amount || 0) / campaign.target_amount) * 100
                          : 0
                      }
                      className="h-1.5 sm:h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.target_amount
                        ? Math.round(((campaign.raised_amount || 0) / campaign.target_amount) * 100)
                        : 0}
                      % goal
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting === campaign.id}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          {isDeleting === campaign.id ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
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
              </div>

              <div className="pt-2 border-t hidden sm:block">
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
          <div className="mb-4 flex justify-center">
            <Image src="/empty.png" alt="No campaigns" width={120} height={120} />
          </div>
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

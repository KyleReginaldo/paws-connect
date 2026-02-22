'use client';

import { useChatFilters } from '@/app/context/ChatFiltersContext';
import {
  ChatFilterModal,
  type ChatFilter,
  type CreateChatFilterDto,
  type UpdateChatFilterDto,
} from '@/components/ChatFilterModal';
import { ChatFilterTable } from '@/components/ChatFilterTable';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notification';
import {
  AlertTriangle,
  Filter,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const ManageChatFilters = () => {
  const { filters, addFilter, updateFilter, deleteFilter, toggleFilterStatus, refreshFilters } =
    useChatFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<ChatFilter | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { warning, success: notifySuccess, error: notifyError } = useNotifications();

  const openEditModal = (filter: ChatFilter) => {
    setEditingFilter(filter);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingFilter(null);
    setModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshFilters();
      notifySuccess('Filters refreshed');
    } catch (err) {
      warning(`Failed to refresh filters: ${(err as Error)?.message ?? 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const success = await deleteFilter(id);
      if (success) {
        notifySuccess('Filter deleted successfully');
      } else {
        notifyError('Failed to delete filter');
      }
    } catch (err) {
      notifyError(`Error: ${(err as Error)?.message ?? 'Failed to delete filter'}`);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const success = await toggleFilterStatus(id, isActive);
      if (success) {
        notifySuccess(`Filter ${isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        notifyError('Failed to update filter status');
      }
    } catch (err) {
      notifyError(`Error: ${(err as Error)?.message ?? 'Failed to update filter status'}`);
    }
  };

  const handleSubmit = async (filterData: CreateChatFilterDto | UpdateChatFilterDto) => {
    try {
      if (editingFilter) {
        await updateFilter(editingFilter.id, filterData as UpdateChatFilterDto);
        notifySuccess('Filter updated successfully');
      } else {
        await addFilter(filterData as CreateChatFilterDto);
        notifySuccess('Filter created successfully');
      }
      setModalOpen(false);
    } catch (err) {
      const message = (err as Error)?.message ?? 'Failed to save filter';
      notifyError(message);
      throw err;
    }
  };

  const totalFilters = filters?.length || 0;
  const activeFilters = filters?.filter((f) => f.is_active).length || 0;
  const inactiveFilters = filters?.filter((f) => !f.is_active).length || 0;
  const lowSeverity = filters?.filter((f) => f.severity === 1 && f.is_active).length || 0;
  const mediumSeverity = filters?.filter((f) => f.severity === 2 && f.is_active).length || 0;
  const highSeverity = filters?.filter((f) => f.severity === 3 && f.is_active).length || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chat Filters Management</h1>
        <p className="text-muted-foreground">
          Manage words and phrases that are filtered from chat messages
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{totalFilters}</span>
            <span className="text-xs opacity-75">Total</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{activeFilters}</span>
            <span className="text-xs opacity-75">Active</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{inactiveFilters}</span>
            <span className="text-xs opacity-75">Inactive</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
            <Shield className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{lowSeverity}</span>
            <span className="text-xs opacity-75">Low</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full border border-yellow-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{mediumSeverity}</span>
            <span className="text-xs opacity-75">Medium</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{highSeverity}</span>
            <span className="text-xs opacity-75">High</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="rounded-full cursor-pointer" size="sm">
            <Plus className="h-4 w-4" />
            Add Filter
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="rounded-full px-3 shadow-sm hover:shadow-md flex items-center cursor-pointer gap-2"
            title="Refresh filters"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {filters && filters.length > 0 ? (
        <ChatFilterTable
          filters={filters}
          onEdit={openEditModal}
          onDelete={handleDeleteFilter}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No chat filters found</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first chat filter</p>
          <Button onClick={openAddModal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </div>
      )}

      <ChatFilterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
        editingFilter={editingFilter}
      />
    </div>
  );
};

export default ManageChatFilters;

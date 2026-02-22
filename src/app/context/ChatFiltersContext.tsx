'use client';
import { ChatFilter, CreateChatFilterDto, UpdateChatFilterDto } from '@/components/ChatFilterModal';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ChatFiltersContextType {
  filters: ChatFilter[] | null;
  status: 'loading' | 'success' | 'error';
  addFilter: (filterData: CreateChatFilterDto) => Promise<ChatFilter>;
  updateFilter: (filterId: string, filterData: UpdateChatFilterDto) => Promise<ChatFilter | null>;
  deleteFilter: (filterId: string) => Promise<boolean>;
  toggleFilterStatus: (filterId: string, isActive: boolean) => Promise<boolean>;
  refreshFilters: () => Promise<void>;
}

const ChatFiltersContext = createContext<ChatFiltersContextType | undefined>(undefined);

export function useChatFilters() {
  const context = useContext(ChatFiltersContext);
  if (context === undefined) {
    throw new Error('useChatFilters must be used within a ChatFiltersProvider');
  }
  return context;
}

interface ChatFiltersProviderProps {
  children: ReactNode;
}

export function ChatFiltersProvider({ children }: ChatFiltersProviderProps) {
  const [filters, setFilters] = useState<ChatFilter[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const fetchFilters = async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/v1/chat-filters');

      if (!response.ok) {
        throw new Error('Failed to fetch chat filters');
      }

      const result = await response.json();
      setFilters(result.data || []);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching chat filters:', error);
      setStatus('error');
      setFilters([]);
    }
  };

  const addFilter = async (filterData: CreateChatFilterDto): Promise<ChatFilter> => {
    try {
      const response = await fetch('/api/v1/chat-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || errorData?.error || 'Failed to create filter';
        throw new Error(message);
      }

      const result = await response.json();
      const newFilter = result.data as ChatFilter;

      setFilters((prevFilters) => {
        if (!prevFilters) return [newFilter];
        return [newFilter, ...prevFilters];
      });

      return newFilter;
    } catch (error) {
      console.error('Error adding filter:', error);
      throw error instanceof Error ? error : new Error('Failed to add filter');
    }
  };

  const updateFilter = async (
    filterId: string,
    filterData: UpdateChatFilterDto,
  ): Promise<ChatFilter | null> => {
    try {
      const response = await fetch(`/api/v1/chat-filters/${filterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.message || 'Failed to update filter');
      }

      const result = await response.json();
      const updatedFilter = result.data;

      setFilters((prevFilters) => {
        if (!prevFilters) return null;
        return prevFilters.map((filter) => (filter.id === filterId ? updatedFilter : filter));
      });

      return updatedFilter;
    } catch (error) {
      console.error('Error updating filter:', error);
      throw error instanceof Error ? error : new Error('Failed to update filter');
    }
  };

  const deleteFilter = async (filterId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/chat-filters/${filterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete filter');
      }

      setFilters((prevFilters) => {
        if (!prevFilters) return null;
        return prevFilters.filter((filter) => filter.id !== filterId);
      });

      return true;
    } catch (error) {
      console.error('Error deleting filter:', error);
      return false;
    }
  };

  const toggleFilterStatus = async (filterId: string, isActive: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/chat-filters/${filterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle filter status');
      }

      const result = await response.json();
      const updatedFilter = result.data;

      setFilters((prevFilters) => {
        if (!prevFilters) return null;
        return prevFilters.map((filter) => (filter.id === filterId ? updatedFilter : filter));
      });

      return true;
    } catch (error) {
      console.error('Error toggling filter status:', error);
      return false;
    }
  };

  const refreshFilters = async () => {
    await fetchFilters();
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  return (
    <ChatFiltersContext.Provider
      value={{
        filters,
        status,
        addFilter,
        updateFilter,
        deleteFilter,
        toggleFilterStatus,
        refreshFilters,
      }}
    >
      {children}
    </ChatFiltersContext.Provider>
  );
}

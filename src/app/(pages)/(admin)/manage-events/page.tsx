'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Event, useEvents } from '@/app/context/EventsContext';
import { EventModal } from '@/components/EventModal';
import { EventTable } from '@/components/EventTable';
import { Button } from '@/components/ui/button';
import { useConfirmation } from '@/components/ui/confirmation';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { CardListSkeleton } from '@/components/ui/skeleton-patterns';
import { Calendar, Download, Plus, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import * as XLSX from 'xlsx';

const ManageEvents = () => {
  const { userRole, userId } = useAuth();
  const { events, status, addEvent, updateEvent, deleteEvent, endEvent, reopenEvent } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { success, error, warning } = useNotifications();
  const { confirm } = useConfirmation();

  // Permission helpers
  const canManageEvents = () => {
    // Admins (role 1) and Staff (role 2) can manage events
    return userRole === 1 || userRole === 2;
  };

  const openEditModal = (event: Event) => {
    if (!canManageEvents()) {
      warning('You do not have permission to edit events.');
      return;
    }
    setEditingEvent(event);
    setModalOpen(true);
  };

  const openAddModal = () => {
    if (!canManageEvents()) {
      warning('You do not have permission to create events.');
      return;
    }
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleModalSubmit = async (eventData: {
    title: string;
    description?: string | null;
    images?: string[];
    created_by?: string | null;
  }) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        success('Event updated successfully!');
      } else {
        await addEvent(eventData);
        success('Event created successfully!');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      error(err instanceof Error ? err.message : 'Failed to save event');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!canManageEvents()) {
      warning('You do not have permission to delete events.');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      const deleted = await deleteEvent(eventId);
      if (deleted) {
        success('Event deleted successfully!');
      } else {
        error('Failed to delete event');
      }
    }
  };

  const handleEndEvent = async (eventId: number) => {
    if (!canManageEvents() || !userId) {
      warning('You do not have permission to end events.');
      return;
    }

    const confirmed = await confirm({
      title: 'End Event',
      message: 'Are you sure you want to end this event? This will mark it as completed.',
      confirmText: 'End Event',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await endEvent(eventId, userId);
        success('Event ended successfully!');
      } catch (err) {
        console.error('Error ending event:', err);
        error(err instanceof Error ? err.message : 'Failed to end event');
      }
    }
  };

  const handleReopenEvent = async (eventId: number) => {
    if (!canManageEvents() || !userId) {
      warning('You do not have permission to reopen events.');
      return;
    }

    const confirmed = await confirm({
      title: 'Reopen Event',
      message: 'Are you sure you want to reopen this event? This will make it active again.',
      confirmText: 'Reopen Event',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await reopenEvent(eventId, userId);
        success('Event reopened successfully!');
      } catch (err) {
        console.error('Error reopening event:', err);
        error(err instanceof Error ? err.message : 'Failed to reopen event');
      }
    }
  };

  // Filter events based on search query
  const filteredEvents =
    events?.filter((event) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.users?.username?.toLowerCase().includes(query)
      );
    }) || [];

  const handleExport = () => {
    if (!events || events.length === 0) return;

    const exportData = events.map((event) => ({
      ID: event.id,
      Title: event.title,
      Description: event.description || '',
      Creator: event.users?.username || 'Unknown',
      'Created At': new Date(event.created_at).toLocaleDateString(),
      'Images Count': event.images?.length || 0,
      'AI Suggestions Count': event.suggestions?.length || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, `events_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Statistics
  const totalEvents = events?.length || 0;
  const eventsWithImages = events?.filter((e) => e.images && e.images.length > 0).length || 0;
  const eventsWithSuggestions =
    events?.filter((e) => e.suggestions && e.suggestions.length > 0).length || 0;
  const uniqueCreators = new Set(events?.map((e) => e.created_by).filter(Boolean)).size;

  if (status === 'loading') {
    return <CardListSkeleton />;
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="mb-4 flex justify-center">
            <Image src="/empty.png" alt="Error" width={120} height={120} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load events</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Events</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage community events and posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canManageEvents() && (
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Total Events</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalEvents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600">With Images</span>
          </div>
          <p className="text-2xl font-bold mt-1">{eventsWithImages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">AI Enhanced</span>
          </div>
          <p className="text-2xl font-bold mt-1">{eventsWithSuggestions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">Creators</span>
          </div>
          <p className="text-2xl font-bold mt-1">{uniqueCreators}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events by title, description, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Events Table */}
      <div className="rounded-lg">
        {filteredEvents.length > 0 ? (
          <EventTable
            events={filteredEvents}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onEndEvent={handleEndEvent}
            onReopenEvent={handleReopenEvent}
          />
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <Image src="/empty.png" alt="No events" width={120} height={120} />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No events match "${searchQuery}"`
                : 'Start creating events to engage with the community'}
            </p>
            {searchQuery ? (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear Search
              </Button>
            ) : canManageEvents() ? (
              <Button className="gap-2" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default ManageEvents;

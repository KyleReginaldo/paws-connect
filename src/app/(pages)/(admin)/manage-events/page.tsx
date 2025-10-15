'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Event, useEvents } from '@/app/context/EventsContext';
import { EventModal } from '@/components/EventModal';
import { EventTableFiltered } from '@/components/EventTableFiltered';
import { Button } from '@/components/ui/button';
import { useConfirmation } from '@/components/ui/confirmation';
import { useNotifications } from '@/components/ui/notification';
import { CardListSkeleton } from '@/components/ui/skeleton-patterns';
import { Calendar, Download, Plus, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import * as XLSX from 'xlsx';

const ManageEvents = () => {
  const { userRole, userId } = useAuth();
  const { events, status, addEvent, updateEvent, deleteEvent, endEvent, reopenEvent } = useEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { success, error, warning } = useNotifications();
  const { confirm } = useConfirmation();

  // Permission helpers
  const canManageEvents = () => {
    // Only admins (role 1) can manage events
    return userRole === 1;
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

  const handleModalSubmit = async (
    eventData: {
      title: string;
      description?: string | null;
      images?: string[];
      created_by?: string | null;
      starting_date?: string | null;
    },
    imageFiles?: File[],
  ) => {
    try {
      if (imageFiles && imageFiles.length > 0) {
        // Create FormData for file uploads
        const formData = new FormData();

        // Add text fields
        formData.append('title', eventData.title);
        if (eventData.description) {
          formData.append('description', eventData.description);
        }
        if (eventData.created_by) {
          formData.append('created_by', eventData.created_by);
        }
        if (eventData.starting_date) {
          formData.append('starting_date', eventData.starting_date);
        }

        // Add existing images (for updates)
        if (eventData.images && eventData.images.length > 0) {
          eventData.images.forEach((imageUrl) => {
            formData.append('existing_images', imageUrl);
          });
        }

        // Add image files
        imageFiles.forEach((file) => {
          formData.append('images', file);
        });

        console.log('🚀 Submitting event with files via FormData');

        if (editingEvent) {
          await updateEvent(editingEvent.id, formData);
          success('Event updated successfully!');
        } else {
          await addEvent(formData);
          success('Event created successfully!');
        }
      } else {
        // Use traditional JSON submission when no files
        console.log('🚀 Submitting event via JSON (no files)');
        if (editingEvent) {
          await updateEvent(editingEvent.id, eventData);
          success('Event updated successfully!');
        } else {
          await addEvent(eventData);
          success('Event created successfully!');
        }
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
          <Button onClick={handleExport} variant="outline" size="sm" className="rounded-full">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canManageEvents() && (
            <Button onClick={openAddModal} className="rounded-full" size={'sm'}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Total Events Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{totalEvents}</span>
          <span className="text-xs opacity-75">Total Events</span>
        </div>

        {/* Events with Images Badge */}
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{eventsWithImages}</span>
          <span className="text-xs opacity-75">With Images</span>
        </div>

        {/* AI Enhanced Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{eventsWithSuggestions}</span>
          <span className="text-xs opacity-75">AI Enhanced</span>
        </div>

        {/* Creators Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full border border-orange-200">
          <Users className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{uniqueCreators}</span>
          <span className="text-xs opacity-75">Creators</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-lg">
        {events && events.length > 0 ? (
          <EventTableFiltered
            events={events}
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
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating events to engage with the community
            </p>
            {canManageEvents() && (
              <Button className="gap-2" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
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

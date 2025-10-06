'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  images: string[] | null;
  suggestions: string[] | null;
  starting_date: string | null;
  ended_at: string | null;
  created_at: string;
  created_by: string | null;
  users?: {
    id: string;
    username: string;
    profile_image_link: string | null;
  } | null;
}

export interface CreateEventDto {
  title: string;
  description?: string | null;
  starting_date?: string | null;
  images?: string[];
  created_by?: string | null;
}

export interface UpdateEventDto {
  title?: string;
  description?: string | null;
  starting_date?: string | null;
  images?: string[];
}

interface EventsContextType {
  events: Event[] | null;
  status: 'loading' | 'success' | 'error';
  addEvent: (eventData: CreateEventDto) => Promise<Event | null>;
  updateEvent: (eventId: number, eventData: UpdateEventDto) => Promise<Event | null>;
  deleteEvent: (eventId: number) => Promise<boolean>;
  endEvent: (eventId: number, endedBy: string) => Promise<Event | null>;
  reopenEvent: (eventId: number, reopenedBy: string) => Promise<Event | null>;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

interface EventsProviderProps {
  children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const fetchEvents = async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/v1/events?limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const result = await response.json();
      setEvents(result.data || []);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching events:', error);
      setStatus('error');
      setEvents([]);
    }
  };

  const addEvent = async (eventData: CreateEventDto): Promise<Event | null> => {
    try {
      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const result = await response.json();
      const newEvent = result.data;

      setEvents((prevEvents) => {
        if (!prevEvents) return [newEvent];
        return [newEvent, ...prevEvents];
      });

      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: number, eventData: UpdateEventDto): Promise<Event | null> => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }

      const result = await response.json();
      const updatedEvent = result.data;

      setEvents((prevEvents) => {
        if (!prevEvents) return null;
        return prevEvents.map((event) => (event.id === eventId ? updatedEvent : event));
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setEvents((prevEvents) => {
        if (!prevEvents) return null;
        return prevEvents.filter((event) => event.id !== eventId);
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  };

  const refreshEvents = async () => {
    await fetchEvents();
  };

  const endEvent = async (eventId: number, endedBy: string): Promise<Event | null> => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ended_by: endedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to end event');
      }

      const result = await response.json();
      const updatedEvent = result.data;

      setEvents((prevEvents) => {
        if (!prevEvents) return null;
        return prevEvents.map((event) => (event.id === eventId ? updatedEvent : event));
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error ending event:', error);
      throw error;
    }
  };

  const reopenEvent = async (eventId: number, reopenedBy: string): Promise<Event | null> => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}/end`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reopened_by: reopenedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reopen event');
      }

      const result = await response.json();
      const updatedEvent = result.data;

      setEvents((prevEvents) => {
        if (!prevEvents) return null;
        return prevEvents.map((event) => (event.id === eventId ? updatedEvent : event));
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error reopening event:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const value: EventsContextType = {
    events,
    status,
    addEvent,
    updateEvent,
    deleteEvent,
    endEvent,
    reopenEvent,
    refreshEvents,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

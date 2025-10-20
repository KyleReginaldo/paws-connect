'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Type guards and helpers for unknown JSON (module-scoped to keep stable identities)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const extractMessage = (json: unknown, text: string | null, fallback: string): string => {
  if (isRecord(json)) {
    const m = json['message'];
    const e = json['error'];
    if (typeof m === 'string' && m.trim()) return m;
    if (typeof e === 'string' && e.trim()) return e;
  }
  return text || fallback;
};

const extractData = <T,>(json: unknown): T | null => {
  if (isRecord(json) && 'data' in json) {
    const d = (json as Record<string, unknown>)['data'];
    return d as T;
  }
  return (json as T) ?? null;
};

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
  addEvent: (eventData: CreateEventDto | FormData) => Promise<Event | null>;
  updateEvent: (eventId: number, eventData: UpdateEventDto | FormData) => Promise<Event | null>;
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

  // Safely read a fetch Response as text and try to parse JSON without causing SyntaxError
  const readResponse = async (
    response: Response,
  ): Promise<{ ok: boolean; json: unknown | null; text: string | null }> => {
    try {
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      let json: unknown | null = null;
      if (text) {
        if (contentType.includes('application/json')) {
          try {
            json = JSON.parse(text);
          } catch {
            json = null;
          }
        } else {
          // Try parsing anyway in case server forgot content-type
          try {
            json = JSON.parse(text);
          } catch {
            json = null;
          }
        }
      }
      return { ok: response.ok, json, text: text || null };
    } catch {
      return { ok: response.ok, json: null, text: null };
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/v1/events?limit=100');
      const { ok, json, text } = await readResponse(response);
      if (!ok) {
        const message = extractMessage(json, text, 'Failed to fetch events');
        throw new Error(message);
      }
      if (!isRecord(json)) {
        throw new Error('Invalid server response');
      }
      const data = extractData<Event[]>(json) || [];
      setEvents(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching events:', error);
      setStatus('error');
      setEvents([]);
    }
  }, []);

  const addEvent = async (eventData: CreateEventDto | FormData): Promise<Event | null> => {
    try {
      let response: Response;

      if (eventData instanceof FormData) {
        // Handle FormData for file uploads
        console.log('🚀 Submitting event with files via FormData');
        response = await fetch('/api/v1/events', {
          method: 'POST',
          body: eventData, // Don't set Content-Type header for FormData
        });
      } else {
        // Handle traditional JSON data (backward compatibility)
        console.log('🚀 Submitting event data via JSON');
        response = await fetch('/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
      }

      const { ok, json, text } = await readResponse(response);
      if (!ok) {
        const message = extractMessage(json, text, 'Failed to create event');
        throw new Error(message);
      }
      const newEvent = extractData<Event>(json) as Event;

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

  const updateEvent = async (
    eventId: number,
    eventData: UpdateEventDto | FormData,
  ): Promise<Event | null> => {
    try {
      let response: Response;

      if (eventData instanceof FormData) {
        // Handle FormData for file uploads
        console.log('🚀 Updating event with files via FormData');
        response = await fetch(`/api/v1/events/${eventId}`, {
          method: 'PUT',
          body: eventData, // Don't set Content-Type header for FormData
        });
      } else {
        // Handle traditional JSON data (backward compatibility)
        console.log('🚀 Updating event data via JSON');
        response = await fetch(`/api/v1/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
      }

      const { ok, json, text } = await readResponse(response);
      if (!ok) {
        const message = extractMessage(json, text, 'Failed to update event');
        throw new Error(message);
      }
      const updatedEvent = extractData<Event>(json) as Event;

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
        const { json, text } = await readResponse(response);
        const message = extractMessage(json, text, 'Failed to delete event');
        throw new Error(message);
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

      const { ok, json, text } = await readResponse(response);
      if (!ok) {
        const message = extractMessage(json, text, 'Failed to end event');
        throw new Error(message);
      }
      const updatedEvent = extractData<Event>(json) as Event;

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

      const { ok, json, text } = await readResponse(response);
      if (!ok) {
        const message = extractMessage(json, text, 'Failed to reopen event');
        throw new Error(message);
      }
      const updatedEvent = extractData<Event>(json) as Event;

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
  }, [fetchEvents]);

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

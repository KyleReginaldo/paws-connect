'use client';

import { Event } from '@/app/context/EventsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableFilter, TableFilters } from '@/components/ui/table-filters';
import {
  Bot,
  Calendar,
  Edit,
  Eye,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

interface EventWithStats extends Event {
  members?: Array<Record<string, unknown>>;
  comments?: Array<{
    likes?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }>;
}

interface EventTableFilteredProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
  onEndEvent: (eventId: number) => void;
  onReopenEvent: (eventId: number) => void;
}

export function EventTableFiltered({
  events,
  onEdit,
  onDelete,
  onEndEvent,
  onReopenEvent,
}: EventTableFilteredProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Generate filter options based on available data
  const filterOptions = useMemo(() => {
    const creatorOptions = [
      ...new Set(events.map((event: Event) => event.users?.username).filter(Boolean)),
    ].map((username) => ({
      label: username as string,
      value: (username as string).toLowerCase(),
      count: events.filter((event: Event) => event.users?.username === username).length,
    }));

    const statusOptions = [
      {
        label: 'Active',
        value: 'active',
        count: events.filter((event: Event) => !event.ended_at).length,
      },
      {
        label: 'Ended',
        value: 'ended',
        count: events.filter((event: Event) => event.ended_at).length,
      },
    ];

    return { creatorOptions, statusOptions };
  }, [events]);

  // Define filters
  const filters: TableFilter[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search events by title or description...',
    },
    {
      id: 'creator',
      label: 'Creator',
      type: 'multiselect',
      options: filterOptions.creatorOptions,
      placeholder: 'Select creators',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: filterOptions.statusOptions,
      placeholder: 'Select status',
    },
    {
      id: 'hasSuggestions',
      label: 'Has AI Suggestions',
      type: 'boolean',
      placeholder: 'Show only events with AI suggestions',
    },
    {
      id: 'hasImages',
      label: 'Has Images',
      type: 'boolean',
      placeholder: 'Show only events with images',
    },
    {
      id: 'createdDate',
      label: 'Created Date',
      type: 'daterange',
      placeholder: 'Select date range',
    },
  ];

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter((event: Event) => {
      // Search filter
      if (filterValues.search) {
        const searchTerm = filterValues.search.toLowerCase();
        const searchableText = [event.title, event.description, event.users?.username]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Creator filter
      if (filterValues.creator && filterValues.creator.length > 0) {
        const eventCreator = event.users?.username?.toLowerCase();
        if (!eventCreator || !filterValues.creator.includes(eventCreator)) {
          return false;
        }
      }

      // Status filter
      if (filterValues.status) {
        const isEnded = !!event.ended_at;
        if (filterValues.status === 'active' && isEnded) {
          return false;
        }
        if (filterValues.status === 'ended' && !isEnded) {
          return false;
        }
      }

      // Has suggestions filter
      if (filterValues.hasSuggestions) {
        if (!event.suggestions || event.suggestions.length === 0) {
          return false;
        }
      }

      // Has images filter
      if (filterValues.hasImages) {
        if (!event.images || event.images.length === 0) {
          return false;
        }
      }

      // Created date filter
      if (filterValues.createdDate?.from) {
        const eventDate = new Date(event.created_at);
        const fromDate = filterValues.createdDate.from;
        const toDate = filterValues.createdDate.to || new Date();

        if (eventDate < fromDate || eventDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, filterValues]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <Calendar className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-500 text-center max-w-md">
          There are no events to display at the moment. Create your first event to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <TableFilters
        filters={filters}
        onFiltersChange={setFilterValues}
        onClearAll={() => setFilterValues({})}
        className="w-full"
      />

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredEvents.length} of {events.length} events
        </span>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: Event) => (
            <div
              key={event.id}
              className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-gray-300"
            >
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {event.images && event.images.length > 0 ? (
                  <>
                    <Image
                      src={event.images[0]}
                      alt={event.title}
                      width={400}
                      height={192}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      priority={false}
                      unoptimized={false}
                    />
                    {event.images.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 h-7 px-2 bg-black/70 text-white border-none shadow-sm"
                      >
                        +{event.images.length - 1} more
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  </div>
                )}

                {/* Actions Menu */}
                <div className="absolute top-3 left-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={`/manage-events/${event.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onEdit(event)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </DropdownMenuItem>

                      {/* End/Reopen Event Actions */}
                      {event.ended_at ? (
                        <DropdownMenuItem
                          onClick={() => onReopenEvent(event.id)}
                          className="cursor-pointer text-green-600 focus:text-green-600"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Reopen Event
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onEndEvent(event.id)}
                          className="cursor-pointer text-orange-600 focus:text-orange-600"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          End Event
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        className="text-destructive cursor-pointer focus:text-destructive"
                        onClick={() => onDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5">
                {/* Title with Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight flex-1">
                    {event.title}
                  </h3>
                  {event.ended_at && (
                    <Badge variant="secondary" className="ml-2 shrink-0 bg-gray-100 text-gray-600">
                      Ended
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {event.description || 'No description available'}
                </p>

                {/* Creator and Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {event.users?.profile_image_link ? (
                      <Image
                        src={event.users.profile_image_link}
                        alt="Creator"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {event.users?.username || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(event.created_at)}</span>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="flex justify-center mb-4">
                  {event.suggestions && event.suggestions.length > 0 ? (
                    <Badge variant="outline" className="text-xs font-medium">
                      <Bot className="h-3 w-3 mr-1" />
                      {event.suggestions.length} suggestion
                      {event.suggestions.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                      No AI suggestions
                    </Badge>
                  )}
                </div>

                {/* Event Stats */}
                <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {(event as EventWithStats).members?.length || 0} member
                      {((event as EventWithStats).members?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <MessageCircle className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {(event as EventWithStats).comments?.length || 0} comment
                      {((event as EventWithStats).comments?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <Heart className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {(event as EventWithStats).comments?.reduce(
                        (total: number, comment) => total + (comment.likes?.length || 0),
                        0,
                      ) || 0}{' '}
                      like
                      {((event as EventWithStats).comments?.reduce(
                        (total: number, comment) => total + (comment.likes?.length || 0),
                        0,
                      ) || 0) === 1
                        ? ''
                        : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No events match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or clearing some filters.
          </p>
          <Button variant="outline" onClick={() => setFilterValues({})}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}

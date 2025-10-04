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
import {
  Bot,
  Calendar,
  Edit,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
  User,
} from 'lucide-react';
import Image from 'next/image';

interface EventTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
  currentUserRole?: number;
}

export function EventTable({ events, onEdit, onDelete, currentUserRole }: EventTableProps) {
  const canManageEvent = () => {
    // Admins (role 1) can manage all events
    if (currentUserRole === 1) return true;
    // Staff (role 2) can manage all events
    if (currentUserRole === 2) return true;
    // Regular users can only manage their own events
    return false;
  };

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
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
                  {canManageEvent() ? (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(event)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer focus:text-destructive"
                        onClick={() => onDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem disabled>
                      <span className="text-sm text-gray-500">No actions available</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-5">
            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight">
              {event.title}
            </h3>

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
            <div className="flex justify-center">
              {event.suggestions && event.suggestions.length > 0 ? (
                <Badge variant="outline" className="text-xs font-medium">
                  <Bot />
                  {event.suggestions.length} suggestion
                  {event.suggestions.length !== 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                  No AI suggestions
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notification';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  PawPrint,
  Sparkles,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EventData {
  id: number;
  title: string;
  description: string | null;
  images: string[] | null;
  suggestions: string[] | null;
  starting_date: string | null;
  ended_at: string | null;
  created_at: string;
  created_by: string | null;
  users: {
    id: string;
    username: string;
    profile_image_link: string | null;
  } | null;
  comments: Array<{
    id: number;
    content: string;
    likes: string[] | null;
    created_at: string | null;
    user: {
      id: string;
      username: string;
      profile_image_link: string | null;
    } | null;
  }>;
  members: Array<{
    id: number;
    joined_at: string;
    user: {
      id: string;
      username: string;
      profile_image_link: string | null;
    } | null;
  }>;
  fundraising: Record<string, unknown> | null;
  pet: Record<string, unknown> | null;
}

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { error: showError } = useNotifications();
  const { userRole } = useAuth();
  const id = params.id as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [selectedCommentLikes, setSelectedCommentLikes] = useState<{
    commentId: number;
    likes: Array<{ id: string; username: string | null; profile_image_link: string | null }>;
  } | null>(null);

  // Check if user is admin
  const isAdmin = userRole === 1;

  useEffect(() => {
    if (!isAdmin) {
      router.push('/unauthorized');
      return;
    }

    if (id) {
      fetch(`/api/v1/events/${id}`)
        .then((res) => res.json())
        .then((eventData) => {
          console.log('Event data:', eventData.data);
          setEvent(eventData.data);
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          setErrorMessage('Failed to load event details');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isAdmin, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(dateString);
  };

  const handleShowLikes = async (commentId: number) => {
    try {
      const response = await fetch(`/api/v1/events/${id}/comment/${commentId}/like`);
      const data = await response.json();

      if (response.ok && data.data) {
        setSelectedCommentLikes({
          commentId,
          likes: data.data.liked_by || [],
        });
        setLikesDialogOpen(true);
      } else {
        showError('Failed to load likes', data.message || 'Unable to fetch comment likes');
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      showError('Error', 'Failed to fetch comment likes');
    }
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container mx-auto px-4 py-6 bg-background min-h-screen">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-6 bg-background min-h-screen">
        <Alert className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">Event not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Sort comments by creation date (newest first)
  const sortedComments = [...event.comments].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );

  // Sort members by join date (newest first)
  const sortedMembers = [...event.members].sort(
    (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant={event.ended_at ? 'secondary' : 'default'}
                    className="text-sm font-medium"
                  >
                    {event.ended_at ? 'Completed' : 'Active'}
                  </Badge>
                  {event.suggestions && event.suggestions.length > 0 && (
                    <Badge variant="outline" className="text-sm font-medium">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-gray-600 leading-relaxed mb-4">{event.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(event.created_at)}</span>
                  </div>
                  {event.starting_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Starts {formatDate(event.starting_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.members.length} member{event.members.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {event.comments.length} comment{event.comments.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              {event.users && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage
                      src={event.users.profile_image_link || undefined}
                      alt={event.users.username}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {event.users.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-500">Created by</p>
                    <p className="font-semibold text-gray-900">{event.users.username}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Images */}
            {event.images && event.images.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    Event Images ({event.images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-purple-300 transition-colors"
                      >
                        <div className="aspect-video relative cursor-pointer">
                          <Image
                            src={imageUrl}
                            alt={`Event image ${index + 1}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            onClick={() => window.open(imageUrl, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-sm text-gray-700 font-medium">
                              View Full Size
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-white">
                          <p className="text-sm text-gray-600 font-medium text-center">
                            Image {index + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {event.suggestions && event.suggestions.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Sparkles className="h-5 w-5" />
                    AI Generated Suggestions
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Community engagement ideas generated by AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-purple-200/50"
                      >
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-700 font-semibold text-xs">{index + 1}</span>
                        </div>
                        <p className="text-sm text-purple-800 font-medium">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Comments ({event.comments.length})
                </CardTitle>
                <CardDescription>Community discussions and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedComments.length > 0 ? (
                  <div className="space-y-4">
                    {sortedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarImage
                              src={comment.user?.profile_image_link || undefined}
                              alt={comment.user?.username || 'User'}
                            />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-sm text-gray-900">
                                {comment.user?.username || 'Unknown User'}
                              </p>
                              <span className="text-xs text-gray-500">
                                {comment.created_at
                                  ? formatRelativeTime(comment.created_at)
                                  : 'Unknown time'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                              {comment.content}
                            </p>

                            {/* Likes */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleShowLikes(comment.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                <Heart className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {comment.likes?.length || 0}
                                </span>
                              </button>
                              {comment.likes && comment.likes.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {comment.likes.length === 1
                                    ? '1 like'
                                    : `${comment.likes.length} likes`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Comments Yet</h3>
                    <p className="text-gray-500">
                      This event hasn&apos;t received any comments from the community.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Members and Stats */}
          <div className="space-y-6">
            {/* Event Members */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Members ({event.members.length})
                </CardTitle>
                <CardDescription>People participating in this event</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedMembers.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                      >
                        <Avatar className="h-10 w-10 border border-gray-200">
                          <AvatarImage
                            src={member.user?.profile_image_link || undefined}
                            alt={member.user?.username || 'User'}
                          />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {member.user?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {formatRelativeTime(member.joined_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No members yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Stats */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-orange-600" />
                  Event Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total Members</span>
                    </div>
                    <span className="text-lg font-bold text-blue-800">{event.members.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Total Comments</span>
                    </div>
                    <span className="text-lg font-bold text-green-800">
                      {event.comments.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Total Likes</span>
                    </div>
                    <span className="text-lg font-bold text-red-800">
                      {event.comments.reduce(
                        (total, comment) => total + (comment.likes?.length || 0),
                        0,
                      )}
                    </span>
                  </div>

                  {event.images && event.images.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Event Images</span>
                      </div>
                      <span className="text-lg font-bold text-purple-800">
                        {event.images.length}
                      </span>
                    </div>
                  )}

                  {event.suggestions && event.suggestions.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">AI Suggestions</span>
                      </div>
                      <span className="text-lg font-bold text-orange-800">
                        {event.suggestions.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Likes Dialog */}
      <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>People who liked this comment</DialogTitle>
            <DialogDescription>
              {selectedCommentLikes?.likes.length || 0} people liked this comment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedCommentLikes?.likes.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage
                    src={user.profile_image_link || undefined}
                    alt={user.username || 'User'}
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">
                  {user.username || 'Unknown User'}
                </span>
              </div>
            ))}
            {(!selectedCommentLikes?.likes || selectedCommentLikes.likes.length === 0) && (
              <div className="text-center py-4 text-gray-500 text-sm">No likes yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailPage;

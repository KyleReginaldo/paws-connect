'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import {
  getStandardWarningMessage,
  moderateContentWithCache,
  type ModerationResult,
} from '@/lib/content-moderation';
import { formatManilaHM } from '@/lib/utils';
import { Eye, EyeOff, Globe2, MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AvatarCircles } from './ui/avatar-circles';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

type ChatMessage = {
  id: number;
  message: string;
  message_warning?: string | null;
  user_id: string | null;
  sent_at: string;
  viewers?: Viewer[];
  user: {
    id: string;
    username: string | null;
    role: number;
  } | null;
};
type Viewer = {
  id: string;
  username: string;
  profile_image_link: string | null;
};

type MessageWithModeration = ChatMessage & {
  moderation?: ModerationResult;
};

export default function GlobalChatWidget() {
  const { userId, userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>(
    'disconnected',
  );
  const [messages, setMessages] = useState<MessageWithModeration[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputWarning, setInputWarning] = useState('');
  const [isCheckingContent, setIsCheckingContent] = useState(false);
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());
  // Removed separate unreadCount state; derive directly for simplicity.
  const bottomRef = useRef<HTMLDivElement>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

  // Convert UTC / any offset to Manila local for display
  const formatSentAt = (value: string) => formatManilaHM(value);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/global-chat?limit=50');
      const data = await response.json();
      if (data.data) {
        console.log('messages fetched:', data.data);
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);
  // Persistent realtime subscription (always listens even when closed)
  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await fetchMessages();
      // Determine forum id
      let forumId = 1;
      try {
        const forumResponse = await fetch('/api/v1/global-chat/forum-info');
        if (forumResponse.ok) {
          const forumData = await forumResponse.json();
          forumId = forumData.forum_id || 1;
        }
      } catch {
        /* silent */
      }

      if (!mounted) return;
      channel = supabase
        .channel('realtime:forum_chats')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'forum_chats', filter: `forum=eq.${forumId}` },
          async () => {
            if (!mounted) return;
            await fetchMessages();
          },
        )
        .subscribe((status) => {
          if (!mounted) return;
          setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
        });
    };
    init();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Open-specific behaviors: mark all unseen messages as viewed for current user (not just admin), auto-scroll
  useEffect(() => {
    if (!open) return;
    // Auto-scroll
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Mark unseen messages via API for any authenticated user
    if (userId && messages.length > 0) {
      const unseen = messages
        .filter((m) => !m.viewers || !m.viewers.some((v) => v.id === userId))
        .map((m) => m.id);
      if (unseen.length) {
        fetch('/api/v1/global-chat/viewers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, message_ids: unseen }),
        })
          .then(() => {
            // Refetch to update viewers so unread count drops immediately
            void fetchMessages();
          })
          .catch((e) => console.error('Failed marking viewed', e));
      }
    }
  }, [open, messages, userId, userRole, fetchMessages]);

  const unreadC = messages.filter(
    (m) => !m.viewers || !m.viewers.some((v) => v.id === userId),
  ).length;
  const send = async () => {
    const content = text.trim();
    if (!content || !userId || loading) return;

    setLoading(true);
    setText('');
    setInputWarning('');

    const optimisticMessage: MessageWithModeration = {
      id: Date.now(),
      message: content,
      user_id: userId,
      sent_at: new Date().toISOString(),
      user: {
        id: userId,
        username: null,
        role: userRole || 3,
      },
      viewers: [],
      message_warning: undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const response = await fetch('/api/v1/global-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      await fetchMessages();

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);

      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));

      setText(content);

      console.error(
        'Message failed to send:',
        error instanceof Error ? error.message : 'Failed to send message',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!text.trim() || !GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      setInputWarning('');
      return;
    }

    const checkContent = async () => {
      try {
        setIsCheckingContent(true);
        const moderation = await moderateContentWithCache(text.trim(), GEMINI_API_KEY);

        if (moderation.isInappropriate && moderation.confidence > 0.7) {
          setInputWarning(getStandardWarningMessage());
        } else {
          setInputWarning('');
        }
      } catch (error) {
        console.error('Content check failed:', error);
        setInputWarning('');
      } finally {
        setIsCheckingContent(false);
      }
    };

    const timeoutId = setTimeout(checkContent, 1000);
    return () => clearTimeout(timeoutId);
  }, [text, GEMINI_API_KEY]);

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 1:
        return (
          <Badge variant="destructive" className="text-xs">
            Admin
          </Badge>
        );
      case 2:
        return (
          <Badge variant="secondary" className="text-xs">
            Staff
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="text-xs">
            User
          </Badge>
        );
      default:
        return null;
    }
  };

  const getUserDisplayName = (msg: MessageWithModeration) => {
    if (!msg.user) return 'Anonymous';
    return msg.user.username || `User${msg.user.id.slice(-4)}`;
  };

  const isMessageInappropriate = (msg: MessageWithModeration) => {
    return Boolean(msg.message_warning);
  };

  const getWarningMessage = (msg: MessageWithModeration) => {
    return msg.message_warning || '';
  };

  const toggleMessageVisibility = (messageId: number) => {
    setHiddenMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const isMessageHidden = (msg: MessageWithModeration) => {
    return isMessageInappropriate(msg) && !hiddenMessages.has(msg.id);
  };
  if (!userId) {
    return null;
  }

  // readMessage used when opening to optimistically mark messages read before API viewer update completes

  const readMessage = async () => {
    // Optimistically update viewers locally to drop unread badge immediately
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.viewers || !m.viewers.some((v) => v.id === userId)) {
          return {
            ...m,
            viewers: [
              ...(m.viewers || []).map((v) => v),
              { id: userId!, username: '', profile_image_link: null },
            ],
          };
        }
        return m;
      }),
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card className="w-96 h-[600px] p-[0px] m-[0px] shadow-2xl transition-all duration-300 ease-in-out bg-white border border-gray-200">
          {/* Header */}
          <div className="flex flex-row items-center justify-between border-b bg-white rounded-t-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-4 text-orange-500" />
              <h3 className="text-xs font-semibold text-gray-800">Global Chat</h3>
              <div className="flex items-center gap-2">
                <span
                  title={`Realtime: ${realtimeStatus}`}
                  className={`h-2 w-2 rounded-full inline-block ${
                    realtimeStatus === 'connected'
                      ? 'bg-green-500'
                      : realtimeStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                  }`}
                />
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-50 text-orange-600 border-orange-200 px-1.5 py-0.5"
                >
                  {unreadC}
                </Badge>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                title="Close chat"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col h-[536px] p-0 m-0 overflow-hidden">
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full px-2 py-1.5">
                <div className="space-y-2.5 pb-1.5">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-orange-300" />
                      <p className="text-xs font-medium text-gray-600">No messages yet</p>
                      <p className="text-xs mt-1 text-gray-500">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-200 mb-[20px]"
                      >
                        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5 ring-1 ring-orange-100">
                          <AvatarFallback className="text-xs bg-orange-100 text-orange-700 font-semibold">
                            {getUserDisplayName(msg)[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-[8px]">
                            <span className="font-semibold text-xs text-gray-800 truncate">
                              {getUserDisplayName(msg)}
                            </span>
                            {msg.user && getRoleBadge(msg.user.role)}
                            <span className="text-muted-foreground text-xs">
                              {formatSentAt(msg.sent_at)}
                            </span>
                          </div>
                          {/* Message Content */}
                          {isMessageInappropriate(msg) ? (
                            <div className="bg-red-50 border-2 border-red-300 shadow-md rounded-md px-2.5 py-1.5 w-fit max-w-[300px]">
                              {isMessageHidden(msg) ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <EyeOff className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-600 font-medium">
                                      Message hidden due to policy violation
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleMessageVisibility(msg.id)}
                                    className="h-6 w-6 p-0 hover:bg-red-200 text-red-600 hover:text-red-700"
                                    title="Show message"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs text-red-600 font-medium">
                                      {getWarningMessage(msg)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleMessageVisibility(msg.id)}
                                      className="h-6 w-6 p-0 hover:bg-red-200 text-red-600 hover:text-red-700"
                                      title="Hide message"
                                    >
                                      <EyeOff className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-900 break-words leading-snug">
                                    {msg.message}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-md px-2.5 py-1.5 w-fit max-w-[300px] border border-gray-100">
                              <p className="text-xs text-gray-900 break-words leading-snug">
                                {msg.message}
                              </p>
                            </div>
                          )}
                          {messages.indexOf(msg) === messages.length - 1 &&
                            msg.viewers &&
                            msg.viewers.length > 0 && (
                              <div className="mt-1">
                                <AvatarCircles
                                  avatarUrls={msg.viewers
                                    .filter((viewer) => viewer.profile_image_link)
                                    .map((viewer) => ({
                                      imageUrl:
                                        viewer.profile_image_link ||
                                        `https://api.dicebear.com/6.x/initials/svg?seed=${viewer.username}&backgroundColor=ffebc8`,
                                      profileUrl:
                                        viewer.profile_image_link ||
                                        `https://api.dicebear.com/6.x/initials/svg?seed=${viewer.username}&backgroundColor=ffebc8`,
                                    }))}
                                  numPeople={Math.max(0, msg.viewers.length - 5)}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area - Contained within the card */}
            {/* Input Area */}

            <div className="border-t bg-white px-2 py-2">
              {inputWarning && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-700">{inputWarning}</p>
                  <p className="text-xs text-yellow-600 mt-1">Consider rephrasing your message.</p>
                </div>
              )}
              <div className="flex gap-1.5 items-end">
                <div className="flex-1">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message..."
                    className={`resize-none focus:border-orange-300 focus:ring-orange-200 rounded-md text-sm leading-snug py-2 px-2.5 min-h-[34px] transition-all duration-200 ${
                      inputWarning ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={send}
                  disabled={loading || !text.trim()}
                  className={`text-white px-2 py-2 rounded-md h-[34px] w-[34px] flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                    inputWarning
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                  title={
                    inputWarning ? 'Message may be inappropriate - send anyway?' : 'Send message'
                  }
                >
                  {loading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : isCheckingContent ? (
                    <div className="h-3 w-3 animate-pulse rounded-full bg-white/50" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={async () => {
            await readMessage();
            setOpen(true);
          }}
          className="h-14 w-14 bg-orange-500 hover:bg-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 rounded-full"
          title="Open Global Chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadC > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center"
              aria-label={`${unreadC} unread messages`}
            >
              {unreadC}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

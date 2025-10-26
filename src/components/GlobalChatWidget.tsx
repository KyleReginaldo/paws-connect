'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import {
  getStandardWarningMessage,
  moderateContentWithCache,
  type ModerationResult,
} from '@/lib/content-moderation';
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
  created_at: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/global-chat?limit=50');
      const data = await response.json();
      if (data.data) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, fetchMessages]);

  // When an admin opens the chat and messages are loaded, mark unseen messages as viewed
  useEffect(() => {
    const markViewed = async (ids: number[]) => {
      try {
        await fetch('/api/v1/global-chat/viewers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, message_ids: ids }),
        });
      } catch (err) {
        console.error('Failed to mark messages viewed', err);
      }
    };

    if (open && userId && userRole === 1 && messages.length > 0) {
      // Find messages that don't include this user in viewers
      const unseen = messages
        .filter((m) => !m.viewers || !m.viewers.some((v) => v.id === userId))
        .map((m) => m.id);

      if (unseen.length > 0) {
        void markViewed(unseen);
      }
    }
  }, [open, messages, userId, userRole]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime:forum_chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'forum_chats', filter: 'forum_id=eq.1' },
        async (payload) => {
          console.log('New message:', payload);
          await fetchMessages();
        },
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
        try {
          // Map supabase subscription status to our local status enum
          // status is typically a string like 'SUBSCRIBED' when connected
          if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
          else if (status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeStatus('disconnected');
          else setRealtimeStatus('disconnected');
        } catch (e) {
          // swallow any errors from mapping
          console.error('Failed to set realtime status', e);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const send = async () => {
    const content = text.trim();
    if (!content || !userId || loading) return;

    setLoading(true);
    setText('');
    setInputWarning('');

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
    } catch (error) {
      console.error('Failed to send message:', error);

      console.error(
        'Message failed to send:',
        error instanceof Error ? error.message : 'Failed to send message',
      );

      setText(content);
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

  const unreadCount = messages.filter((m) => {
    if (!m.viewers || m.viewers.length === 0) return true;
    return !m.viewers.some((v) => v.id === userId);
  }).length;

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
                  {unreadCount}
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
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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
                          {/* Show viewers only on the last message */}
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
          onClick={() => setOpen(true)}
          className="h-14 w-14 bg-orange-500 hover:bg-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 rounded-full"
          title="Open Global Chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

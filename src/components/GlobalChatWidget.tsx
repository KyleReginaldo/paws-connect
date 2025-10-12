'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

type ChatMessage = {
  id: number;
  message: string;
  user_id: string | null;
  created_at: string;
  user: {
    id: string;
    username: string | null;
    role: number;
  } | null;
};

export default function GlobalChatWidget() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages from API
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const response = await fetch('/api/v1/global-chat?limit=50');
        const data = await response.json();
        if (data.data) {
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch initial messages:', error);
      }
    };
    
    if (open) {
      fetchInitial();
    }
  }, [open]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!open) return;

    // First get the global forum ID, then subscribe to changes
    const setupSubscription = async () => {
      const { data: globalForum } = await supabase
        .from('forum')
        .select('id')
        .eq('forum_name', 'Global Chat')
        .single();

      if (!globalForum) return;

      const channel = supabase
        .channel('global_chat_realtime')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'forum_chats',
            filter: `forum=eq.${globalForum.id}`
          },
          async (payload) => {
            // Fetch the complete message with user info
            const { data: newMessageData } = await supabase
              .from('forum_chats')
              .select(`
                id,
                message,
                sent_at,
                sender,
                users!forum_chats_sender_fkey (
                  id,
                  username,
                  role
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newMessageData) {
              const formattedMessage: ChatMessage = {
                id: newMessageData.id,
                message: newMessageData.message || '',
                created_at: newMessageData.sent_at,
                user_id: newMessageData.sender,
                user: newMessageData.users
                  ? {
                      id: newMessageData.users.id,
                      username: newMessageData.users.username,
                      role: newMessageData.users.role,
                    }
                  : null,
              };
              setMessages((prev) => [...prev, formattedMessage]);
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [open]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  const send = async () => {
    const content = text.trim();
    if (!content || !userId || loading) return;
    
    setLoading(true);
    setText('');
    
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
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setText(content); // Restore text on error
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 1:
        return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 2:
        return <Badge variant="secondary" className="text-xs">Staff</Badge>;
      case 3:
        return <Badge variant="outline" className="text-xs">User</Badge>;
      default:
        return null;
    }
  };

  const getUserDisplayName = (msg: ChatMessage) => {
    if (!msg.user) return 'Anonymous';
    return msg.user.username || `User${msg.user.id.slice(-4)}`;
  };

  if (!userId) {
    return null; // Don't show chat if user is not logged in
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card className={`w-80 shadow-lg transition-all duration-200 ${minimized ? 'h-12' : 'h-96'}`}>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium">Global Chat</CardTitle>
              <Badge variant="outline" className="text-xs">{messages.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setMinimized(!minimized)}
                className="h-6 w-6 p-0"
              >
                {minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          
          {!minimized && (
            <CardContent className="p-0 flex flex-col h-80">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 py-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet.</p>
                      <p className="text-xs">Be the first to say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2 text-sm">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                            {getUserDisplayName(msg)[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs truncate">
                              {getUserDisplayName(msg)}
                            </span>
                            {msg.user && getRoleBadge(msg.user.role)}
                            <span className="text-muted-foreground text-xs">
                              {new Date(msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button 
                    onClick={send} 
                    disabled={!text.trim() || loading}
                    size="sm"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ) : (
        <Button 
          onClick={() => setOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </Button>
      )}
    </div>
  );
}

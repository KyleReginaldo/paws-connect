'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

type Message = {
  id: number;
  message: string;
  user_id: string | null;
  created_at: string;
};

export default function GlobalChatWidget() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('global_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setMessages((data || []).reverse());
    };
    fetchInitial();

    const channel = supabase
      .channel('global_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await supabase
      .from('global_chat_messages')
      .insert({ message: content, user_id: userId || null });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card className="w-80 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-base">Global Chat</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              –
            </Button>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-64 overflow-y-auto space-y-2 border rounded-md p-2 bg-background">
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{m.message}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Type a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <Button onClick={send} disabled={!text.trim()}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setOpen(true)}>Chat</Button>
      )}
    </div>
  );
}

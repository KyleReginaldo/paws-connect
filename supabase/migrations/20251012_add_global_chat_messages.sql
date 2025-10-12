-- Global chat messages table for site-wide chat
create table if not exists public.global_chat_messages (
  id bigserial primary key,
  message text not null,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Index for realtime ordering
create index if not exists idx_global_chat_messages_created_at on public.global_chat_messages(created_at desc);

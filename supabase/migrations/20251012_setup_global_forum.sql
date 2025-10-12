-- Create a global forum for site-wide chat
-- This forum will be public and accessible to all users

-- Insert the global forum if it doesn't exist
insert into public.forum (forum_name, created_by, private, created_at, updated_at)
select 'Global Chat', null, false, now(), now()
where not exists (select 1 from public.forum where forum_name = 'Global Chat');

-- Ensure the global forum has ID 1 for easy reference
-- Note: This is a safe operation that won't affect existing data
do $$
declare
    global_forum_id integer;
begin
    -- Get the current global forum ID
    select id into global_forum_id from public.forum where forum_name = 'Global Chat' limit 1;
    
    -- If it's not ID 1, we'll work with whatever ID it has
    -- The application will query by name rather than assume ID 1
end $$;

-- Create an index on forum_chats for better performance when querying global chat
create index if not exists idx_forum_chats_forum_sent_at on public.forum_chats(forum, sent_at desc);

-- Add a comment to document the global forum purpose
comment on table public.forum is 'Forums for discussions. The "Global Chat" forum serves as the site-wide public chat.';

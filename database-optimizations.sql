-- Database Performance Optimizations for Chat and Forum Fetching
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Index for forum_chats table (most critical)
CREATE INDEX IF NOT EXISTS idx_forum_chats_forum_sent_at 
ON forum_chats (forum, sent_at DESC);

-- 2. Index for forum_chats viewers queries
CREATE INDEX IF NOT EXISTS idx_forum_chats_viewers 
ON forum_chats USING GIN (viewers);

-- 3. Index for forum_members lookups
CREATE INDEX IF NOT EXISTS idx_forum_members_forum_member 
ON forum_members (forum, member);

-- 4. Index for users table (profile lookups)
CREATE INDEX IF NOT EXISTS idx_users_id_username 
ON users (id) INCLUDE (username, profile_image_link);

-- 5. Index for mentions table
CREATE INDEX IF NOT EXISTS idx_mentions_user 
ON mentions (user);

-- 6. Composite index for forum privacy checks
CREATE INDEX IF NOT EXISTS idx_forum_id_private_created_by 
ON forum (id, private, created_by);

-- 7. Index for reactions table
CREATE INDEX IF NOT EXISTS idx_reactions_chat_user 
ON reactions (chat_id, user_id);

-- 8. Optimize forum_chats for pagination
CREATE INDEX IF NOT EXISTS idx_forum_chats_pagination 
ON forum_chats (forum, sent_at DESC, id);

-- Performance monitoring queries (optional - run to check performance)
-- EXPLAIN ANALYZE SELECT * FROM forum_chats WHERE forum = 1 ORDER BY sent_at DESC LIMIT 20;
-- EXPLAIN ANALYZE SELECT * FROM users WHERE id = ANY(ARRAY['user1', 'user2', 'user3']);
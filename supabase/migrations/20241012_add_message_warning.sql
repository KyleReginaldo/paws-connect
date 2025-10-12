-- Add message_warning column to forum_chats table
-- This column will store AI moderation warnings

ALTER TABLE forum_chats 
ADD COLUMN message_warning TEXT;
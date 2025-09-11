// Database utilities for optimized queries
import { supabase } from '@/app/supabase/supabase';

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  key?: string; // Cache key
}

// Simple in-memory cache for frequently accessed data
class SimpleCache {
  private cache = new Map<string, { data: unknown; expires: number }>();

  set(key: string, data: unknown, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string): unknown {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Optimized forum existence check with caching
export async function checkForumExists(forumId: number, useCache = true): Promise<boolean> {
  const cacheKey = `forum_exists_${forumId}`;
  
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as boolean;
  }

  const { data, error } = await supabase
    .from('forum')
    .select('id')
    .eq('id', forumId)
    .single();

  const exists = !error && !!data;
  
  if (useCache) {
    cache.set(cacheKey, exists, 60); // Cache for 1 minute
  }
  
  return exists;
}

// Optimized user existence check with caching
export async function checkUserExists(userId: string, useCache = true): Promise<boolean> {
  const cacheKey = `user_exists_${userId}`;
  
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as boolean;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  const exists = !error && !!data;
  
  if (useCache) {
    cache.set(cacheKey, exists, 300); // Cache for 5 minutes
  }
  
  return exists;
}

// Batch existence checks
export async function checkBothExist(forumId: number, userId: string) {
  const [forumExists, userExists] = await Promise.all([
    checkForumExists(forumId),
    checkUserExists(userId)
  ]);
  
  return { forumExists, userExists };
}

// Optimized chat queries with minimal field selection
export const CHAT_SELECT_FIELDS = `
  id,
  message,
  sent_at,
  sender,
  users!forum_chats_sender_fkey (
    id,
    username
  )
`;

export const FORUM_SELECT_FIELDS = `
  id,
  forum_name,
  created_at,
  updated_at,
  created_by,
  users!forum_created_by_fkey (
    id,
    username
  )
`;

// Standard response helpers
export function createResponse(data: unknown, status = 200, options: { cache?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (options.cache) {
    headers['Cache-Control'] = options.cache;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

export function createErrorResponse(message: string, status = 500, details?: unknown) {
  const responseData: { error: string; details?: unknown } = { error: message };
  if (details) {
    responseData.details = details;
  }
  return createResponse(responseData, status);
}

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
      expires: Date.now() + ttlSeconds * 1000,
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

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Optimized forum existence check with minimal caching
export async function checkForumExists(forumId: number, useCache = false): Promise<boolean> {
  const cacheKey = `forum_exists_${forumId}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as boolean;
  }

  const { data, error } = await supabase.from('forum').select('id').eq('id', forumId).single();

  const exists = !error && !!data;

  if (useCache) {
    cache.set(cacheKey, exists, 10); // Cache for only 10 seconds if enabled
  }

  return exists;
}

// Optimized user existence check with minimal caching
export async function checkUserExists(userId: string, useCache = false): Promise<boolean> {
  const cacheKey = `user_exists_${userId}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as boolean;
  }

  const { data, error } = await supabase.from('users').select('id').eq('id', userId).single();

  const exists = !error && !!data;

  if (useCache) {
    cache.set(cacheKey, exists, 30); // Cache for only 30 seconds if enabled
  }

  return exists;
}

// Batch existence checks
export async function checkBothExist(forumId: number, userId: string) {
  const [forumExists, userExists] = await Promise.all([
    checkForumExists(forumId),
    checkUserExists(userId),
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
  private,
  users!forum_created_by_fkey (
    id,
    username
  )
`;

export const FORUM_WITH_MEMBERS_SELECT_FIELDS = `
  id,
  forum_name,
  created_at,
  updated_at,
  created_by,
  private,
  users!forum_created_by_fkey (
    id,
    username
  ),
  forum_members!forum_members_forum_fkey (
    id,
    created_at,
    member,
    invitation_status,
    users!forum_members_member_fkey (
      id,
      username,
      profile_image_link
    )
  )
`;

// Forum fetching utilities
export interface ForumWithMembers {
  id: number;
  forum_name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  private: boolean | null;
  users?: {
    id: string;
    username: string;
  } | null;
  forum_members?: Array<{
    id: number;
    created_at: string;
    member: string;
    users?: {
      id: string;
      username: string;
      profile_image_link: string | null;
    } | null;
    invitation_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  }>;
}

export interface ProcessedForum {
  id: number;
  forum_name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  private: boolean | null;
  users?: {
    id: string;
    username: string;
  } | null;
  members: Array<{
    id: string;
    username: string;
    profile_image_link: string | null;
    joined_at: string;
    invitation_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  }>;
  member_count: number;
}

// Process forum data to flatten members and add creator if not explicit member
export function processForumWithMembers(forum: ForumWithMembers): ProcessedForum {
  const explicitMembers = forum.forum_members || [];

  // Flatten the member structure
  const flattenedMembers = explicitMembers.map((member) => ({
    id: member.users?.id || member.member,
    username: member.users?.username || '',
    profile_image_link: member.users?.profile_image_link || null,
    joined_at: member.created_at,
    invitation_status: member.invitation_status,
  }));

  // Calculate member count properly - don't double count creator
  const creatorIsExplicitMember = flattenedMembers.some((m) => m.id === forum.created_by);
  const memberCount =
    flattenedMembers.length + (forum.created_by && !creatorIsExplicitMember ? 1 : 0);

  return {
    id: forum.id,
    forum_name: forum.forum_name,
    created_at: forum.created_at,
    updated_at: forum.updated_at,
    created_by: forum.created_by,
    private: forum.private,
    users: forum.users,
    members: flattenedMembers,
    member_count: memberCount,
  };
}

// Fetch a single forum with members - no caching by default
export async function fetchForumWithMembers(
  forumId: number,
  userId: string,
  useCache = false,
): Promise<ProcessedForum | null> {
  const cacheKey = `forum_with_members_${forumId}_${userId}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as ProcessedForum;
  }

  const { data, error } = await supabase
    .from('forum')
    .select(FORUM_WITH_MEMBERS_SELECT_FIELDS)
    .eq('id', forumId)
    .single();

  if (error || !data) return null;

  // Check if user is the creator
  const isCreator = data.created_by === userId;
  
  // Create a copy of the forum to modify
  const forumCopy = { ...data };
  
  // Filter members based on user role
  if (!isCreator && forumCopy.forum_members) {
    // Non-creators can only see approved members
    forumCopy.forum_members = forumCopy.forum_members.filter(
      (member) => member.invitation_status === 'APPROVED',
    );
  }
  // Creators can see all members (no filtering needed)

  const processedForum = processForumWithMembers(forumCopy as ForumWithMembers);

  if (useCache) {
    cache.set(cacheKey, processedForum, 5); // Cache for only 5 seconds if enabled
  }

  return processedForum;
}

// Fetch multiple forums with members (with pagination) - no caching by default
export async function fetchForumsWithMembers(
  options: {
    page?: number;
    limit?: number;
    createdBy?: string;
    userId?: string; // For privacy filtering
    useCache?: boolean;
  } = {},
): Promise<{ data: ProcessedForum[]; count: number | null }> {
  const { page = 1, limit = 20, createdBy, userId, useCache = false } = options;
  console.log('created by', createdBy);

  const offset = (page - 1) * limit;
  const cacheKey = `forums_with_members_${JSON.stringify(options)}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as { data: ProcessedForum[]; count: number | null };
  }

  // Build query with privacy filtering if userId provided
  let query = supabase
    .from('forum')
    .select(FORUM_WITH_MEMBERS_SELECT_FIELDS, { count: 'exact' })
    .or(`forums.created_by.eq.${createdBy},invitation_status.eq.APPROVED`);

  // Apply privacy filter if user provided
  if (userId) {
    // Get accessible forum IDs
    const [memberForums, createdForums] = await Promise.all([
      supabase.from('forum_members').select('forum').eq('member', userId),
      supabase.from('forum').select('id').eq('created_by', userId),
    ]);

    const memberForumIds = memberForums.data?.map((f) => f.forum) || [];
    const createdForumIds = createdForums.data?.map((f) => f.id) || [];
    const accessibleForumIds = [...new Set([...memberForumIds, ...createdForumIds])];

    if (accessibleForumIds.length > 0) {
      query = query.or(`private.is.null,private.eq.false,id.in.(${accessibleForumIds.join(',')})`);
    } else {
      query = query.or('private.is.null,private.eq.false');
    }
  } else {
    // No user provided, only show public forums
    query = query.or('private.is.null,private.eq.false');
  }

  // Apply additional filters
  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  // Apply ordering and pagination
  query = query
    .order('created_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { data: [], count: 0 };
  }

  const processedForums = (data || []).map((forum) =>
    processForumWithMembers(forum as ForumWithMembers),
  );

  const result = { data: processedForums, count };

  if (useCache) {
    cache.set(cacheKey, result, 5); // Cache for only 5 seconds if enabled
  }

  return result;
}

// Fetch forums where user is creator or member - no caching by default
export async function fetchUserForums(userId: string, useCache = false): Promise<ProcessedForum[]> {
  const cacheKey = `user_forums_${userId}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached as ProcessedForum[];
  }

  // Get forums where user is the creator
  const { data: createdForums } = await supabase
    .from('forum')
    .select(FORUM_WITH_MEMBERS_SELECT_FIELDS)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  // Get forums where user is a member (any status - pending, approved, rejected)
  const { data: memberForums } = await supabase
    .from('forum_members')
    .select(
      `
      forum!inner (${FORUM_WITH_MEMBERS_SELECT_FIELDS})
    `,
    )
    .eq('member', userId);

  // Combine and deduplicate forums
  const allForums = [...(createdForums || [])];
  const memberForumsList = memberForums?.map((mf) => mf.forum).filter(Boolean) || [];

  // Add member forums that aren't already in created forums
  memberForumsList.forEach((memberForum) => {
    const isDuplicate = allForums.some((forum) => forum.id === memberForum.id);
    if (!isDuplicate) {
      allForums.push(memberForum);
    }
  });

  // Sort by creation date
  allForums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Process all forums with member filtering based on user role
  const processedForums = allForums.map((forum) => {
    const isCreator = forum.created_by === userId;

    // Create a copy of the forum to modify
    const forumCopy = { ...forum };

    // Filter members based on user role
    if (!isCreator && forumCopy.forum_members) {
      // Non-creators can only see approved members
      forumCopy.forum_members = forumCopy.forum_members.filter(
        (member) => member.invitation_status === 'APPROVED',
      );
    }
    // Creators can see all members (no filtering needed)

    const processed = processForumWithMembers(forumCopy as ForumWithMembers);
    return {
      ...processed,
      user_role: isCreator ? 'creator' : 'member',
    };
  });

  if (useCache) {
    cache.set(cacheKey, processedForums, 5); // Cache for only 5 seconds if enabled
  }

  return processedForums;
}

// Cache invalidation utilities
export function invalidateForumCache(forumId: number) {
  const cacheKey = `forum_with_members_${forumId}`;
  cache.delete(cacheKey);
}

export function invalidateUserForumsCache(userId: string) {
  const cacheKey = `user_forums_${userId}`;
  cache.delete(cacheKey);
}

// Standard response helpers
export function createResponse(data: unknown, status = 200, options: { cache?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

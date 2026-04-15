import { useState, useEffect, useCallback } from 'react';
import type { Post, MediaType } from '../types';
import { SAMPLE_FEED_URL, SAMPLE_FEED_NO_COMMENTS_URL, getSamplePosts } from '../data/sampleFeed';
import { getProxiedUrl, shouldUseProxy, getDiscourseBaseUrl, isDemoFeed } from './proxyConfig';

/**
 * Topic metadata including engagement data and author info
 */
interface TopicMetadata {
  likes: number;
  commentCount: number;
  authorAvatar?: string;
  authorTitle?: string;
  authorName?: string;
}

/**
 * Cache for topic engagement data (likes, comment count).
 * Key: topicId, Value: { data, timestamp }
 * Cache expires after 5 minutes.
 */
const topicEngagementCache = new Map<number, { 
  likes: number; 
  commentCount: number;
  timestamp: number;
}>();

/**
 * Cache for author information to avoid refetching for repeat authors.
 * Key: username, Value: { avatar, title, name, timestamp }
 * Cache expires after 5 minutes.
 */
interface AuthorInfo {
  avatar?: string;
  title?: string;
  name?: string;
  timestamp: number;
}
const authorCache = new Map<string, AuthorInfo>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a URL will be proxied in development
 */
export function isProxiedUrl(url: string): boolean {
  return shouldUseProxy(url);
}

/**
 * Get the Discourse API URL for a topic
 */
function getDiscourseTopicUrl(topicId: number, feedUrl: string): string {
  // Skip for demo feeds
  if (isDemoFeed(feedUrl)) {
    return '';
  }
  
  const baseUrl = getDiscourseBaseUrl(feedUrl);
  return `${baseUrl}/t/${topicId}.json`;
}

/**
 * Extract topic ID from Discourse RSS guid or link
 * guid format: "community.enterprise.health-topic-{id}"
 * link format: "https://community.enterprise.health/t/{slug}/{id}"
 */
function extractTopicId(guid: string, link?: string): number | undefined {
  // Try to extract from guid first
  const guidMatch = guid.match(/-topic-(\d+)$/);
  if (guidMatch) {
    return parseInt(guidMatch[1], 10);
  }
  
  // Fallback to link
  if (link) {
    const linkMatch = link.match(/\/t\/[^/]+\/(\d+)/);
    if (linkMatch) {
      return parseInt(linkMatch[1], 10);
    }
  }
  
  return undefined;
}

function extractMediaFromContent(content: string): { type: MediaType; url?: string; thumbnail?: string } {
  // Check for YouTube embeds or links
  const youtubeMatch = content.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/watch?v=${youtubeMatch[1]}`,
      thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`,
    };
  }

  // Check for MP4 videos
  const videoMatch = content.match(/src=["']([^"']+\.mp4[^"']*)["']/i);
  if (videoMatch) {
    return { type: 'video', url: videoMatch[1] };
  }

  // Check for images
  const imageMatch = content.match(/src=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)[^"']*)["']/i);
  if (imageMatch) {
    return { type: 'image', url: imageMatch[1] };
  }

  // Fallback - look for any image in srcset or data-src
  const anySrcMatch = content.match(/(?:src|srcset|data-src)=["']([^"'\s]+)["']/i);
  if (anySrcMatch) {
    const url = anySrcMatch[1].split(',')[0].trim().split(' ')[0];
    if (url.match(/\.(mp4|webm|mov)/i)) {
      return { type: 'video', url };
    }
    return { type: 'image', url };
  }

  // No media found
  return { type: 'none', url: undefined };
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function parseRSS(xmlString: string): Post[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const items = doc.querySelectorAll('item');

  const posts: Post[] = [];

  items.forEach((item, index) => {
    const title = item.querySelector('title')?.textContent || '';
    const description = item.querySelector('description')?.textContent || '';
    const content = item.getElementsByTagNameNS('*', 'encoded')[0]?.textContent || description;
    const pubDate = item.querySelector('pubDate')?.textContent;
    const creator = item.getElementsByTagNameNS('*', 'creator')[0]?.textContent || 'Anonymous';
    const guid = item.querySelector('guid')?.textContent || `post-${index}`;
    const link = item.querySelector('link')?.textContent || undefined;

    // Check for media in <enclosure> or <media:content> tags first
    const enclosure = item.querySelector('enclosure');
    const mediaContent = item.getElementsByTagNameNS('*', 'content')[0];
    
    let media: { type: MediaType; url?: string; thumbnail?: string };
    
    if (enclosure) {
      const url = enclosure.getAttribute('url') || '';
      const type = enclosure.getAttribute('type') || '';
      
      if (url.includes('youtube.com') || url.includes('youtu.be') || type.includes('youtube')) {
        const youtubeId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        media = {
          type: 'youtube',
          url,
          thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined,
        };
      } else if (type.startsWith('video/') || url.match(/\.(mp4|webm|mov)$/i)) {
        media = { type: 'video', url };
      } else if (type.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        media = { type: 'image', url };
      } else {
        media = extractMediaFromContent(content);
      }
    } else if (mediaContent) {
      const url = mediaContent.getAttribute('url') || '';
      const type = mediaContent.getAttribute('type') || '';
      
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const youtubeId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        media = {
          type: 'youtube',
          url,
          thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined,
        };
      } else if (type.startsWith('video/')) {
        media = { type: 'video', url };
      } else if (type.startsWith('image/')) {
        media = { type: 'image', url };
      } else {
        media = extractMediaFromContent(content);
      }
    } else {
      // Fallback to extracting from content
      media = extractMediaFromContent(content);
    }
    
    // Use content:encoded (full post) for caption, fall back to description (excerpt)
    const caption = stripHtml(content || description);
    const topicId = extractTopicId(guid, link);

    posts.push({
      id: guid,
      topicId,
      title,
      author: {
        name: creator,
      },
      caption: caption || title,
      mediaType: media.type,
      mediaUrl: media.url,
      thumbnailUrl: media.thumbnail,
      link,
      timestamp: pubDate ? new Date(pubDate) : new Date(),
      // likes and commentCount will be fetched from Discourse API
      likes: undefined,
      commentCount: undefined,
      isLiked: false,
    });
  });

  return posts;
}

/**
 * Discourse topic API response (partial)
 */
interface DiscourseTopicResponse {
  id: number;
  like_count: number;
  posts_count: number;
  reply_count: number;
  details?: {
    created_by?: {
      id: number;
      username: string;
      name: string;
      avatar_template: string;
    };
  };
  post_stream?: {
    posts?: Array<{
      username: string;
      avatar_template: string;
      user_title?: string;
      name?: string;
    }>;
  };
}

/**
 * Fetch engagement data for a single topic from Discourse API
 * Uses separate caches for engagement data and author info.
 */
async function fetchTopicMetadata(
  topicId: number,
  feedUrl: string
): Promise<TopicMetadata | null> {
  // Demo feeds already have likes/commentCount in the post data, skip fetching
  if (isDemoFeed(feedUrl)) {
    return null;
  }

  const url = getDiscourseTopicUrl(topicId, feedUrl);
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data: DiscourseTopicResponse = await response.json();
    
    // Get author info from the first post (the original post)
    const firstPost = data.post_stream?.posts?.[0];
    const username = firstPost?.username;
    const baseUrl = getDiscourseBaseUrl(feedUrl);
    
    // Check author cache - reuse cached author info if available
    let authorInfo: AuthorInfo | undefined;
    if (username) {
      const cachedAuthor = authorCache.get(username);
      if (cachedAuthor && Date.now() - cachedAuthor.timestamp < CACHE_TTL_MS) {
        // Use cached author info
        authorInfo = cachedAuthor;
      } else {
        // Build avatar URL from template (replace {size} with 96)
        let authorAvatar: string | undefined;
        if (firstPost?.avatar_template) {
          const avatarPath = firstPost.avatar_template.replace('{size}', '96');
          authorAvatar = avatarPath.startsWith('/') ? `${baseUrl}${avatarPath}` : avatarPath;
        }
        
        authorInfo = {
          avatar: authorAvatar,
          title: firstPost?.user_title,
          name: firstPost?.name || data.details?.created_by?.name,
          timestamp: Date.now(),
        };
        
        // Cache author info by username for reuse across topics
        authorCache.set(username, authorInfo);
      }
    }
    
    // Cache engagement data
    const engagement = {
      likes: data.like_count,
      commentCount: data.reply_count,
      timestamp: Date.now(),
    };
    topicEngagementCache.set(topicId, engagement);
    
    return {
      likes: engagement.likes,
      commentCount: engagement.commentCount,
      authorAvatar: authorInfo?.avatar,
      authorTitle: authorInfo?.title,
      authorName: authorInfo?.name,
    };
  } catch (err) {
    console.warn(`Failed to fetch topic ${topicId} metadata:`, err);
    return null;
  }
}

/**
 * Fetch engagement data for all posts in parallel
 */
async function enrichPostsWithMetadata(
  posts: Post[],
  feedUrl: string
): Promise<Post[]> {
  const metadataPromises = posts.map(async (post) => {
    if (post.topicId === undefined) {
      return post;
    }
    
    const metadata = await fetchTopicMetadata(post.topicId, feedUrl);
    if (metadata) {
      return {
        ...post,
        likes: metadata.likes,
        commentCount: metadata.commentCount,
        author: {
          ...post.author,
          // Use full name if available, fallback to RSS creator
          name: metadata.authorName || post.author.name,
          avatar: metadata.authorAvatar,
          title: metadata.authorTitle,
        },
      };
    }
    return post;
  });

  return Promise.all(metadataPromises);
}

export function useFeed(feedUrl: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure media URLs are absolute and proxied in dev as needed
  const normalizeMediaUrl = useCallback((url?: string): string | undefined => {
    if (!url) return url;
    try {
      // Relative path from RSS (e.g., /uploads/...)
      if (url.startsWith('/')) {
        const base = getDiscourseBaseUrl(feedUrl);
        return `${base}${url}`;
      }

      // Absolute URL that should be proxied in dev
      if (import.meta.env.DEV && shouldUseProxy(url)) {
        return getProxiedUrl(url);
      }

      return url;
    } catch {
      return url;
    }
  }, [feedUrl]);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Handle sample feeds for local testing
    const isSampleFeed = feedUrl === SAMPLE_FEED_URL || feedUrl === SAMPLE_FEED_NO_COMMENTS_URL;
    if (isSampleFeed) {
      const samplePosts = getSamplePosts();
      // Sample posts already have likes/commentCount, no need to enrich
      setPosts(samplePosts);
      setLoading(false);
      return;
    }

    try {
      const fetchUrl = getProxiedUrl(feedUrl);
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlText = await response.text();
      const parsedPosts = parseRSS(xmlText);

      // Normalize media URLs to ensure they resolve in dev/prod
      const normalizedPosts = parsedPosts.map((p) => ({
        ...p,
        mediaUrl: normalizeMediaUrl(p.mediaUrl),
        thumbnailUrl: normalizeMediaUrl(p.thumbnailUrl),
      }));

      // Set posts immediately so UI shows content
      setPosts(normalizedPosts);
      setLoading(false);
      
      // Fetch engagement data in background
      enrichPostsWithMetadata(normalizedPosts, feedUrl).then((enrichedPosts) => {
        setPosts(enrichedPosts);
      });
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      setLoading(false);
    }
  }, [feedUrl, normalizeMediaUrl]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const toggleLike = useCallback(async (postId: string) => {
    // Optimistically update UI
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: (post.likes ?? 0) + (post.isLiked ? -1 : 1),
            }
          : post
      )
    );

    // For non-demo feeds, send to server
    if (!isDemoFeed(feedUrl)) {
      const post = posts.find(p => p.id === postId);
      if (!post?.topicId) return;

      try {
        const baseUrl = getDiscourseBaseUrl(feedUrl);
        const action = post.isLiked ? 'unlike' : 'like';
        const response = await fetch(`${baseUrl}/posts/${post.topicId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        
        if (!response.ok) {
          console.warn('Failed to sync like to server');
        }
      } catch (err) {
        console.warn('Failed to sync like to server:', err);
      }
    }
  }, [feedUrl, posts]);

  return { posts, loading, error, refetch: fetchFeed, toggleLike };
}

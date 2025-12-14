import { useState, useEffect, useCallback } from 'react';
import type { Post, MediaType } from '../types';
import { SAMPLE_FEED_URL, SAMPLE_FEED_NO_COMMENTS_URL, getSamplePosts } from '../data/sampleFeed';
import { getProxiedUrl, shouldUseProxy, getDiscourseBaseUrl, isDemoFeed } from './proxyConfig';

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

    const media = extractMediaFromContent(content);
    const caption = stripHtml(description).slice(0, 200);
    const topicId = extractTopicId(guid, link);

    posts.push({
      id: guid,
      topicId,
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
}

/**
 * Fetch engagement data for a single topic from Discourse API
 */
async function fetchTopicMetadata(
  topicId: number,
  feedUrl: string
): Promise<{ likes: number; commentCount: number } | null> {
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
    return {
      likes: data.like_count,
      // posts_count includes the original post, so subtract 1 for reply count
      // or use reply_count directly
      commentCount: data.reply_count,
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
      
      // Set posts immediately so UI shows content
      setPosts(parsedPosts);
      setLoading(false);
      
      // Fetch engagement data in background
      enrichPostsWithMetadata(parsedPosts, feedUrl).then((enrichedPosts) => {
        setPosts(enrichedPosts);
      });
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      setLoading(false);
    }
  }, [feedUrl]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const toggleLike = useCallback((postId: string) => {
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
  }, []);

  return { posts, loading, error, refetch: fetchFeed, toggleLike };
}

import { useState, useEffect, useCallback } from 'react';
import type { Post, MediaType } from '../types';
import { SAMPLE_FEED_URL, getSamplePosts } from '../data/sampleFeed';

// URLs matching this pattern are proxied through Vite dev server
// In production, these should have Access-Control-Allow-Origin set
const PROXIED_HOST = 'community.enterprise.health';

/**
 * Check if a URL will be proxied in development
 */
export function isProxiedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.host === PROXIED_HOST;
  } catch {
    return false;
  }
}

/**
 * Convert a feed URL to use the dev proxy if needed
 */
function getProxiedUrl(url: string): string {
  if (import.meta.env.DEV && isProxiedUrl(url)) {
    const parsed = new URL(url);
    return `/api/rss${parsed.pathname}${parsed.search}`;
  }
  return url;
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

    const media = extractMediaFromContent(content);
    const caption = stripHtml(description).slice(0, 200);

    posts.push({
      id: guid,
      author: {
        name: creator,
      },
      caption: caption || title,
      mediaType: media.type,
      mediaUrl: media.url,
      thumbnailUrl: media.thumbnail,
      timestamp: pubDate ? new Date(pubDate) : new Date(),
      likes: Math.floor(Math.random() * 100), // Mock data
      commentCount: Math.floor(Math.random() * 20), // Mock data
      isLiked: false,
    });
  });

  return posts;
}

export function useFeed(feedUrl: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Handle sample feed for local testing
    if (feedUrl === SAMPLE_FEED_URL) {
      setPosts(getSamplePosts());
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
      setPosts(parsedPosts);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
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
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  }, []);

  return { posts, loading, error, refetch: fetchFeed, toggleLike };
}

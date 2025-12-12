import { useState, useEffect, useCallback } from 'react';
import type { Post, MediaType } from '../types';

const RSS_URL = 'https://community.enterprise.health/c/testing/11.rss';

// CORS proxy for development - in production you'd use your own backend
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function extractMediaFromContent(content: string): { type: MediaType; url: string; thumbnail?: string } {
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

  // Default placeholder
  return {
    type: 'image',
    url: 'https://via.placeholder.com/400x300?text=No+Media',
  };
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
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(creator)}&background=random`,
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

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_URL)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlText = await response.text();
      const parsedPosts = parseRSS(xmlText);
      setPosts(parsedPosts);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      // Set fallback demo posts on error
      setPosts(getDemoPosts());
    } finally {
      setLoading(false);
    }
  }, []);

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

function getDemoPosts(): Post[] {
  return [
    {
      id: 'demo-1',
      author: { name: 'Demo User', avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random' },
      caption: 'Check out this amazing video about React development!',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      timestamp: new Date(),
      likes: 42,
      commentCount: 5,
      isLiked: false,
    },
    {
      id: 'demo-2',
      author: { name: 'Tech News', avatar: 'https://ui-avatars.com/api/?name=Tech+News&background=random' },
      caption: 'Beautiful sunset captured on camera',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=1',
      timestamp: new Date(Date.now() - 3600000),
      likes: 128,
      commentCount: 12,
      isLiked: true,
    },
    {
      id: 'demo-3',
      author: { name: 'Video Creator', avatar: 'https://ui-avatars.com/api/?name=Video+Creator&background=random' },
      caption: 'Sample MP4 video demonstration',
      mediaType: 'video',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      timestamp: new Date(Date.now() - 7200000),
      likes: 89,
      commentCount: 8,
      isLiked: false,
    },
    {
      id: 'demo-4',
      author: { name: 'Nature Photos', avatar: 'https://ui-avatars.com/api/?name=Nature+Photos&background=random' },
      caption: 'Mountain landscape photography',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=2',
      timestamp: new Date(Date.now() - 10800000),
      likes: 256,
      commentCount: 24,
      isLiked: false,
    },
  ];
}

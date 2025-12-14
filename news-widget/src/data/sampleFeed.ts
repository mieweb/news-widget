import type { Post } from '../types';

/**
 * Sample feed data for local testing and automated tests.
 * 
 * IMPORTANT: External dependencies are minimized for test reliability:
 * - YouTube URLs are allowed (for video playback testing)
 * - No other external image/video services (picsum.photos, w3schools, etc.)
 * - Images use placeholder gradients via mediaType 'none' or inline SVG data URIs
 * 
 * This ensures automated tests don't fail due to flaky network requests.
 */

/** Sample feed with engagement features (likes/comments) */
export const SAMPLE_FEED_URL = 'demo://sample-feed';

/** Sample feed without engagement features */
export const SAMPLE_FEED_NO_COMMENTS_URL = 'demo://sample-feed-no-comments';

/**
 * Mock Discourse topic data - simulates /t/{id}.json API responses
 */
interface MockTopicData {
  likes: number;
  commentCount: number;
}

const MOCK_TOPIC_DATA: Record<number, MockTopicData> = {
  1001: { likes: 42, commentCount: 0 },
  1002: { likes: 128, commentCount: 0 },
  1003: { likes: 89, commentCount: 0 },
  1004: { likes: 256, commentCount: 0 },
  1005: { likes: 312, commentCount: 0 },
  1006: { likes: 567, commentCount: 0 },
  1007: { likes: 234, commentCount: 0 },
};

/**
 * Get mock topic data for a given topic ID.
 * Simulates the Discourse API /t/{id}.json response.
 */
export function getMockTopicData(topicId: number): MockTopicData | null {
  return MOCK_TOPIC_DATA[topicId] ?? null;
}

export function getSamplePosts(): Post[] {
  return [
    {
      id: 'demo-1',
      topicId: 1001,
      author: {
        name: 'React Team',
      },
      caption: 'Introducing React 19 - New features and improvements for building modern web apps!',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
      thumbnailUrl: 'https://img.youtube.com/vi/T8TZQ6k4SLE/hqdefault.jpg',
      link: 'https://react.dev/blog/2024/12/05/react-19',
      timestamp: new Date(),
      // likes and commentCount will be fetched from mock API
      isLiked: false,
    },
    {
      id: 'demo-2',
      topicId: 1002,
      author: {
        name: 'Tech News',
      },
      caption: 'Beautiful sunset captured on camera 🌅',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 3600000),
      isLiked: true,
    },
    {
      id: 'demo-3',
      topicId: 1003,
      author: {
        name: 'Video Creator',
      },
      caption: 'Big Buck Bunny - Open source animated short film demo',
      mediaType: 'youtube', // Using YouTube instead of external MP4 for test reliability
      mediaUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      timestamp: new Date(Date.now() - 7200000),
      isLiked: false,
    },
    {
      id: 'demo-4',
      topicId: 1004,
      author: {
        name: 'Nature Photos',
      },
      caption: 'Mountain landscape photography - Imagine beautiful snow-capped peaks 🏔️',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 10800000),
      isLiked: false,
    },
    {
      id: 'demo-5',
      topicId: 1005,
      author: {
        name: 'Code Tips',
      },
      caption: 'TypeScript tips and tricks for better code quality ✨',
      mediaType: 'none', // Text-only to avoid external image dependency
      link: 'https://www.typescriptlang.org/docs/',
      timestamp: new Date(Date.now() - 14400000),
      isLiked: false,
    },
    {
      id: 'demo-6',
      topicId: 1006,
      author: {
        name: 'Long Post Author',
      },
      caption: 'This is a very long caption that should be truncated by CSS because it contains a lot of text. We want to test the expand/collapse functionality to make sure the "...more" button appears when content is truncated. The button should allow users to expand the caption to read the full text, and then collapse it again if needed. This feature is important for improving the user experience by keeping the feed cards compact while still allowing access to full content.',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 18000000),
      isLiked: false,
    },
    {
      id: 'demo-7',
      topicId: 1007,
      author: {
        name: 'Text Only Post',
      },
      caption: 'This is a text-only post without any media attached. It should display the caption in the media container area with a nice gradient background. When the text is long enough to exceed the line clamp limit, we should see the "...more" button appear to allow users to expand and read the full content. This type of post is common for announcements, updates, or discussion topics that do not require visual media but still have important textual information to share with the community.',
      mediaType: 'none',
      timestamp: new Date(Date.now() - 21600000),
      isLiked: true,
    },
  ];
}

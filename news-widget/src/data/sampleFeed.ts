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

export function getSamplePosts(): Post[] {
  return [
    {
      id: 'demo-1',
      topicId: 1001,
      title: 'Introducing React 19',
      author: {
        name: 'React Team',
        avatar: 'https://avatars.githubusercontent.com/u/6412038?s=96&v=4',
        title: 'Core Maintainers',
      },
      caption: 'New features and improvements for building modern web apps!',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
      thumbnailUrl: 'https://img.youtube.com/vi/T8TZQ6k4SLE/hqdefault.jpg',
      link: 'https://react.dev/blog/2024/12/05/react-19',
      timestamp: new Date(),
      likes: 42,
      commentCount: 0,
      isLiked: false,
    },
    {
      id: 'demo-2',
      topicId: 1002,
      title: 'Beautiful Sunset Photography',
      author: {
        name: 'Tech News',
        title: 'Photography Editor',
      },
      caption: 'Beautiful sunset captured on camera 🌅',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 3600000),
      likes: 128,
      commentCount: 0,
      isLiked: true,
    },
    {
      id: 'demo-3',
      topicId: 1003,
      title: 'Big Buck Bunny Demo',
      author: {
        name: 'Video Creator',
        title: 'Content Producer',
      },
      caption: 'Open source animated short film demo',
      mediaType: 'youtube', // Using YouTube instead of external MP4 for test reliability
      mediaUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      timestamp: new Date(Date.now() - 7200000),
      likes: 89,
      commentCount: 0,
      isLiked: false,
    },
    {
      id: 'demo-4',
      topicId: 1004,
      title: 'Mountain Landscape Photography',
      author: {
        name: 'Nature Photos',
        title: 'Outdoor Photographer',
      },
      caption: 'Imagine beautiful snow-capped peaks 🏔️',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 10800000),
      likes: 256,
      commentCount: 0,
      isLiked: false,
    },
    {
      id: 'demo-5',
      topicId: 1005,
      title: 'TypeScript Tips and Tricks',
      author: {
        name: 'Code Tips',
        title: 'Senior Developer',
      },
      caption: 'Better code quality with TypeScript ✨',
      mediaType: 'none', // Text-only to avoid external image dependency
      link: 'https://www.typescriptlang.org/docs/',
      timestamp: new Date(Date.now() - 14400000),
      likes: 312,
      commentCount: 0,
      isLiked: false,
    },
    {
      id: 'demo-6',
      topicId: 1006,
      title: 'Testing Long Caption Truncation',
      author: {
        name: 'Long Post Author',
        title: 'QA Engineer',
      },
      caption: 'This is a very long caption that should be truncated by CSS because it contains a lot of text. We want to test the expand/collapse functionality to make sure the "...more" button appears when content is truncated. The button should allow users to expand the caption to read the full text, and then collapse it again if needed.',
      mediaType: 'none', // Text-only to avoid external image dependency
      timestamp: new Date(Date.now() - 18000000),
      likes: 567,
      commentCount: 0,
      isLiked: false,
    },
    {
      id: 'demo-7',
      topicId: 1007,
      title: 'Text Only Post Example',
      author: {
        name: 'Text Only Post',
        title: 'Community Member',
      },
      caption: 'This is a text-only post without any media attached. It should display the caption in the media container area with a nice gradient background. When the text is long enough to exceed the line clamp limit, we should see the "...more" button appear.',
      mediaType: 'none',
      timestamp: new Date(Date.now() - 21600000),
      likes: 234,
      commentCount: 0,
      isLiked: true,
    },
  ];
}

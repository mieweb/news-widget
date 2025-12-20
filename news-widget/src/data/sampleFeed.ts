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
 * 
 * TIMESTAMP SAMPLES: Posts are dated to demonstrate progressive temporal disclosure:
 * - "Just now" (< 1 min)
 * - "Xm" (minutes, < 1 hour)
 * - "Xh" (hours, < 24 hours)
 * - "Yesterday" (1-2 days)
 * - "Xd" (days, < 7 days)
 * - "Mon D" (same year)
 * - "Mon D, YYYY" (different year)
 */

/** Sample feed with engagement features (likes/comments) */
export const SAMPLE_FEED_URL = 'demo://sample-feed';

/** Sample feed without engagement features */
export const SAMPLE_FEED_NO_COMMENTS_URL = 'demo://sample-feed-no-comments';

// Time constants for readability
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function getSamplePosts(): Post[] {
  const now = Date.now();
  
  return [
    // "Just now" - posted 30 seconds ago
    {
      id: 'demo-1',
      topicId: 1001,
      title: 'Breaking: Just Posted!',
      author: {
        name: 'React Team',
        avatar: 'https://avatars.githubusercontent.com/u/6412038?s=96&v=4',
        title: 'Core Maintainers',
      },
      caption: 'This post was just published! You should see "Just now" as the timestamp.',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
      thumbnailUrl: 'https://img.youtube.com/vi/T8TZQ6k4SLE/hqdefault.jpg',
      link: 'https://react.dev/blog/2024/12/05/react-19',
      timestamp: new Date(now - 30 * 1000), // 30 seconds ago
      likes: 42,
      commentCount: 0,
      isLiked: false,
    },
    // "Xm" - posted 15 minutes ago
    {
      id: 'demo-2',
      topicId: 1002,
      title: 'Posted Minutes Ago',
      author: {
        name: 'Tech News',
        title: 'Photography Editor',
      },
      caption: 'This post was published 15 minutes ago. You should see "15m" as the timestamp. 🕐',
      mediaType: 'none',
      timestamp: new Date(now - 15 * MINUTE),
      likes: 128,
      commentCount: 0,
      isLiked: true,
    },
    // "Xh" - posted 5 hours ago
    {
      id: 'demo-3',
      topicId: 1003,
      title: 'Posted Hours Ago',
      author: {
        name: 'Video Creator',
        title: 'Content Producer',
      },
      caption: 'This post was published 5 hours ago. You should see "5h" as the timestamp.',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      timestamp: new Date(now - 5 * HOUR),
      likes: 89,
      commentCount: 0,
      isLiked: false,
    },
    // "Yesterday" - posted 30 hours ago
    {
      id: 'demo-4',
      topicId: 1004,
      title: 'Posted Yesterday',
      author: {
        name: 'Nature Photos',
        title: 'Outdoor Photographer',
      },
      caption: 'This post was published yesterday (~30 hours ago). You should see "Yesterday" as the timestamp. 🏔️',
      mediaType: 'none',
      timestamp: new Date(now - 30 * HOUR),
      likes: 256,
      commentCount: 0,
      isLiked: false,
    },
    // "Xd" - posted 4 days ago
    {
      id: 'demo-5',
      topicId: 1005,
      title: 'Posted Days Ago',
      author: {
        name: 'Code Tips',
        title: 'Senior Developer',
      },
      caption: 'This post was published 4 days ago. You should see "4d" as the timestamp. ✨',
      mediaType: 'none',
      link: 'https://www.typescriptlang.org/docs/',
      timestamp: new Date(now - 4 * DAY),
      likes: 312,
      commentCount: 0,
      isLiked: false,
    },
    // "Mon D" - posted 3 weeks ago (same year)
    {
      id: 'demo-6',
      topicId: 1006,
      title: 'Posted Weeks Ago (Same Year)',
      author: {
        name: 'Long Post Author',
        title: 'QA Engineer',
      },
      caption: 'This post was published 3 weeks ago. You should see a date like "Nov 28" as the timestamp (month and day only, since it\'s the same year).',
      mediaType: 'none',
      timestamp: new Date(now - 21 * DAY),
      likes: 567,
      commentCount: 0,
      isLiked: false,
    },
    // "Mon D" - posted 6 months ago (same year)
    {
      id: 'demo-7',
      topicId: 1007,
      title: 'Posted Months Ago (Same Year)',
      author: {
        name: 'Archive Team',
        title: 'Community Member',
      },
      caption: 'This post was published 6 months ago. You should see a date like "Jun 19" as the timestamp (month and day only, since it\'s still the same year).',
      mediaType: 'none',
      timestamp: new Date(now - 180 * DAY),
      likes: 234,
      commentCount: 0,
      isLiked: true,
    },
    // "Mon D, YYYY" - posted last year
    {
      id: 'demo-8',
      topicId: 1008,
      title: 'Posted Last Year',
      author: {
        name: 'Historical Archive',
        title: 'Archivist',
      },
      caption: 'This post was published over a year ago. You should see a full date like "Dec 19, 2024" as the timestamp (includes year since it\'s a different year).',
      mediaType: 'none',
      timestamp: new Date(now - 365 * DAY),
      likes: 1024,
      commentCount: 0,
      isLiked: false,
    },
    // "Mon D, YYYY" - posted 2 years ago
    {
      id: 'demo-9',
      topicId: 1009,
      title: 'Posted Two Years Ago',
      author: {
        name: 'Vintage Content',
        title: 'Legacy Team',
      },
      caption: 'This classic post was published 2 years ago. You should see a full date like "Dec 19, 2023" as the timestamp.',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      timestamp: new Date(now - 730 * DAY),
      likes: 9999,
      commentCount: 0,
      isLiked: true,
    },
  ];
}

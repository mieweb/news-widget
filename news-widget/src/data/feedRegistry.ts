import { SAMPLE_FEED_NO_COMMENTS_URL } from './sampleFeed';
import type { FeedCapabilities } from '../types';

export interface FeedConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  emoji: string;
  /** Feed capabilities - defaults to { supportsLikes: false, supportsComments: false } if not specified */
  capabilities?: FeedCapabilities;
}

export interface FeedSection {
  title: string;
  feeds: FeedConfig[];
}

/**
 * Registry of all available feeds.
 * Feed IDs are used for deep linking (e.g., #/feed/testing)
 */
export const FEED_SECTIONS: FeedSection[] = [
  {
    title: 'Demo Feeds',
    feeds: [
      {
        id: 'test-server',
        name: 'Test Server',
        description: 'Local Discourse-like test server',
        // Uses embedded Vite plugin - no separate server needed
        url: 'http://localhost:5173/api/test/c/testing/1.rss',
        emoji: '🧪',
        capabilities: { supportsLikes: true, supportsComments: true },
      },
      {
        id: 'sample',
        name: 'Sample Feed',
        description: 'Demo content without engagement',
        url: SAMPLE_FEED_NO_COMMENTS_URL,
        emoji: '🎭',
        // No capabilities - defaults to no likes/comments
      },
    ],
  },
  {
    title: 'Enterprise Health',
    feeds: [
      {
        id: 'features',
        name: 'Features',
        description: 'Product features and announcements',
        url: 'https://community.enterprise.health/c/features/5.rss',
        emoji: '✨',
        capabilities: { supportsLikes: true, supportsComments: true },
      },
      {
        id: 'testing',
        name: 'Test',
        description: 'Testing and QA discussions',
        url: 'https://community.enterprise.health/c/testing/11.rss',
        emoji: '🧪',
        capabilities: { supportsLikes: true, supportsComments: true },
      },
      {
        id: 'public',
        name: 'Public',
        description: 'Public community content',
        url: 'https://community.enterprise.health/c/public-category/12.rss',
        emoji: '🌐',
        capabilities: { supportsLikes: true, supportsComments: true },
      },
    ],
  },
];

/**
 * Flattened lookup of all feeds by ID.
 */
export const FEEDS_BY_ID: Record<string, FeedConfig> = FEED_SECTIONS
  .flatMap((section) => section.feeds)
  .reduce((acc, feed) => {
    acc[feed.id] = feed;
    return acc;
  }, {} as Record<string, FeedConfig>);

/**
 * Get a feed configuration by its ID.
 */
export function getFeedById(id: string): FeedConfig | undefined {
  return FEEDS_BY_ID[id];
}

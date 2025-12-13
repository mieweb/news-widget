import { SAMPLE_FEED_URL } from './sampleFeed';

export interface FeedConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  emoji: string;
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
    title: 'Enterprise Health',
    feeds: [
      {
        id: 'features',
        name: 'Features',
        description: 'Product features and announcements',
        url: 'https://community.enterprise.health/c/features/5.rss',
        emoji: '✨',
      },
      {
        id: 'testing',
        name: 'Test',
        description: 'Testing and QA discussions',
        url: 'https://community.enterprise.health/c/testing/11.rss',
        emoji: '🧪',
      },
      {
        id: 'public',
        name: 'Public',
        description: 'Public community content',
        url: 'https://community.enterprise.health/c/public-category/12.rss',
        emoji: '🌐',
      },
    ],
  },
  {
    title: 'Made Up Feed',
    feeds: [
      {
        id: 'sample',
        name: 'Sample Feed',
        description: 'Demo content for local testing',
        url: SAMPLE_FEED_URL,
        emoji: '🎭',
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

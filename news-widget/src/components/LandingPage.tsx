import { useState } from 'react';
import { SAMPLE_FEED_URL } from '../data/sampleFeed';
import { isProxiedUrl } from '../hooks/useFeed';
import './LandingPage.css';

interface FeedOption {
  id: string;
  name: string;
  description: string;
  url: string;
  emoji: string;
}

interface FeedSection {
  title: string;
  feeds: FeedOption[];
}

const FEED_SECTIONS: FeedSection[] = [
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

interface LandingPageProps {
  onSelectFeed: (feedUrl: string, feedName: string) => void;
}

export function LandingPage({ onSelectFeed }: LandingPageProps) {
  const [showInfoId, setShowInfoId] = useState<string | null>(null);

  const handleInfoClick = (e: React.MouseEvent, feedId: string) => {
    e.stopPropagation();
    setShowInfoId(showInfoId === feedId ? null : feedId);
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>📰 News Feed</h1>
        <p className="landing-subtitle">Select a channel to view</p>
      </header>

      <main className="landing-content">
        {FEED_SECTIONS.map((section) => (
          <section key={section.title} className="feed-section">
            <h2 className="feed-section-title">{section.title}</h2>
            <div className="feed-grid">
              {section.feeds.map((feed) => (
                <div key={feed.id} className="feed-card-wrapper">
                  <button
                    className="feed-card-link"
                    onClick={() => onSelectFeed(feed.url, feed.name)}
                    aria-label={`Open ${feed.name} feed`}
                  >
                    <span className="feed-emoji">{feed.emoji}</span>
                    <h3 className="feed-name">{feed.name}</h3>
                    <p className="feed-description">{feed.description}</p>
                  </button>
                  <button
                    className="feed-info-button"
                    onClick={(e) => handleInfoClick(e, feed.id)}
                    aria-label={`Show URL for ${feed.name}`}
                    aria-expanded={showInfoId === feed.id}
                  >
                    ℹ️
                  </button>
                  {showInfoId === feed.id && (
                    <div className="feed-info-popup" role="tooltip">
                      <code>{feed.url}</code>
                      {import.meta.env.DEV && isProxiedUrl(feed.url) && (
                        <p className="feed-info-proxy-note">
                          🔀 Proxied via Vite dev server
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="landing-footer">
        <p>Powered by Enterprise Health Community</p>
      </footer>
    </div>
  );
}

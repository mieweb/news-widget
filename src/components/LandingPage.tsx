import { useState } from 'react';
import { Button, Card, CardContent, Tooltip } from '@mieweb/ui';
import { Info, Newspaper, Star, Shuffle } from 'lucide-react';
import { FEED_SECTIONS, type FeedConfig } from '../data/feedRegistry';
import { isProxiedUrl } from '../hooks/useFeed';
import './LandingPage.css';

interface LandingPageProps {
  onSelectFeed: (feedId: string) => void;
}

export function LandingPage({ onSelectFeed }: LandingPageProps) {
  const [showInfoId, setShowInfoId] = useState<string | null>(null);

  const handleInfoClick = (e: React.MouseEvent, feedId: string) => {
    e.stopPropagation();
    setShowInfoId(showInfoId === feedId ? null : feedId);
  };

  const renderFeedCard = (feed: FeedConfig) => (
    <div key={feed.id} className="feed-card-wrapper">
      <Card
        interactive
        className="feed-card-link"
        onClick={() => onSelectFeed(feed.id)}
        aria-label={`Open ${feed.name} feed`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectFeed(feed.id);
          }
        }}
      >
        <CardContent className="feed-card-content">
          <span className="feed-emoji">{feed.emoji}</span>
          <h3 className="feed-name">{feed.name}</h3>
          <p className="feed-description">{feed.description}</p>
        </CardContent>
      </Card>
      <Tooltip content={feed.url}>
        <Button
          variant="ghost"
          size="icon"
          className="feed-info-button"
          onClick={(e) => handleInfoClick(e, feed.id)}
          aria-label={`Show URL for ${feed.name}`}
          aria-expanded={showInfoId === feed.id}
        >
          <Info size={16} />
        </Button>
      </Tooltip>
      {showInfoId === feed.id && (
        <div className="feed-info-popup" role="tooltip">
          <code>{feed.url}</code>
          {import.meta.env.DEV && isProxiedUrl(feed.url) && (
            <p className="feed-info-proxy-note">
              <Shuffle size={14} aria-hidden="true" /> Proxied via Vite dev server
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1><Newspaper size={28} aria-hidden="true" /> News Feed</h1>
        <p className="landing-subtitle">Select a channel to view</p>
      </header>

      <main className="landing-content">
        {FEED_SECTIONS.map((section) => (
          <section key={section.title} className="feed-section">
            <h2 className="feed-section-title">{section.title}</h2>
            <div className="feed-grid">
              {section.feeds.map(renderFeedCard)}
            </div>
          </section>
        ))}
      </main>

      <footer className="landing-footer">
        <p>
          Developed by{' '}
          <a href="https://www.mieweb.com" target="_blank" rel="noopener noreferrer">
            Medical Informatics Engineering, Inc.
          </a>
        </p>
        <p>
          <a
            href="https://github.com/mieweb/news-widget"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <Star size={16} aria-hidden="true" /> View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

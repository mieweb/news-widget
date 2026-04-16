import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, SpinnerWithLabel, Alert, RefreshIcon, ChevronIcon } from '@mieweb/ui';
import { LogOut, Newspaper } from 'lucide-react';
import { Feed, FullscreenViewer, LandingPage } from './components';
import { useFeed, useRouter, useDiscourseAuth, getDiscourseBaseUrl } from './hooks';
import { getFeedById, type FeedConfig } from './data/feedRegistry';
import type { Post } from './types';
import './App.css';

// Default Discourse URL for auth (used when feed supports comments)
const DEFAULT_DISCOURSE_URL = 'https://community.enterprise.health';

/**
 * Extract base URL from a feed URL for Discourse API calls
 * Uses proxy paths in development
 */
function getFeedBaseUrl(feedUrl: string): string | undefined {
  try {
    // Use the centralized proxy config for proper URL handling
    return getDiscourseBaseUrl(feedUrl);
  } catch {
    return undefined;
  }
}

interface FeedViewProps {
  feed: FeedConfig;
  postId: string | null;
  onBack?: () => void;
  onNavigateToPost: (postId: string) => void;
  onClearPostId: () => void;
}

function FeedView({ feed, postId, onBack, onNavigateToPost, onClearPostId }: FeedViewProps) {
  const { posts, loading, error, refetch, toggleLike } = useFeed(feed.url);
  const [fullscreenPost, setFullscreenPost] = useState<Post | null>(null);
  
  // Compute feed base URL for Discourse API
  const feedBaseUrl = useMemo(() => getFeedBaseUrl(feed.url), [feed.url]);
  
  // Discourse auth
  const discourseUrl = feedBaseUrl || DEFAULT_DISCOURSE_URL;
  const { isAuthenticated, postComment, openLogin, checkSession, logout } = useDiscourseAuth(discourseUrl);
  
  // Check if this is the test server (for showing logout button)
  const isTestServer = feedBaseUrl === '/api/test';

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenPost(null);
    onClearPostId();
  }, [onClearPostId]);

  const fullscreenIndex = fullscreenPost
    ? posts.findIndex((p) => p.id === fullscreenPost.id)
    : -1;

  // If we have a postId from the URL and posts are loaded, open fullscreen for that post
  const targetPost = postId ? posts.find((p) => p.id === postId) : null;
  if (targetPost && !fullscreenPost && !loading) {
    // Open fullscreen for deep-linked post
    setFullscreenPost(targetPost);
  }

  if (loading) {
    return (
      <div className="app-loading">
        <SpinnerWithLabel label="Loading feed..." size="lg" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="app-error">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to channels">
            <ChevronIcon direction="left" />
          </Button>
        )}
        <h1><Newspaper size={24} aria-hidden="true" /> {feed.name}</h1>
        <div className="header-actions">
          {isTestServer && isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut size={18} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={refetch} aria-label="Refresh feed">
            <RefreshIcon />
          </Button>
        </div>
      </header>

      <main className="app-main">
        <Feed
          posts={posts}
          onToggleLike={toggleLike}
          scrollToPostId={postId}
          onScrolledToPost={fullscreenPost ? undefined : onClearPostId}
          capabilities={feed.capabilities}
          feedBaseUrl={feedBaseUrl}
                    feedId={feed.id}
          isAuthenticated={isAuthenticated}
          postToDiscourse={postComment}
          onLogin={openLogin}
          onCheckLogin={checkSession}
        />
      </main>

      {fullscreenPost && fullscreenIndex >= 0 && (
        <FullscreenViewer
          posts={posts}
          initialIndex={fullscreenIndex}
          onClose={handleCloseFullscreen}
                    feedId={feed.id}
          onToggleLike={toggleLike}
          capabilities={feed.capabilities}
          feedBaseUrl={feedBaseUrl}
          isAuthenticated={isAuthenticated}
          postToDiscourse={postComment}
          onLogin={openLogin}
          onCheckLogin={checkSession}
        />
      )}
    </div>
  );
}

export interface AppProps {
  /** Feed ID to render directly (skips landing page). Use with registerFeed() for custom feeds. */
  feedId?: string;
}

function App({ feedId: propFeedId }: AppProps) {
  const { route, navigateToFeed, navigateToPost, navigateToLanding, clearPostId } = useRouter();

  // Handle Discourse topic URLs (e.g., /t/topic-slug/1001 or /api/test/t/topic-slug/1001)
  useEffect(() => {
    const path = window.location.pathname;
    const topicMatch = path.match(/^(?:\/api\/test)?\/t\/([^/]+)\/(\d+)$/);
    
    if (topicMatch) {
      const [, slug, topicId] = topicMatch;
      // Redirect to the RSS feed view
      window.location.href = `/api/test/t/${slug}/${topicId}`;
    }
  }, [navigateToFeed]);

  const handleSelectFeed = useCallback((feedId: string) => {
    navigateToFeed(feedId);
  }, [navigateToFeed]);

  const handleBack = useCallback(() => {
    navigateToLanding();
  }, [navigateToLanding]);

  const handleNavigateToPost = useCallback((postId: string) => {
    const activeFeedId = propFeedId || route.feedId;
    if (activeFeedId) {
      navigateToPost(activeFeedId, postId);
    }
  }, [propFeedId, route.feedId, navigateToPost]);

  // When feedId prop is provided, use it directly (single-feed / iframe mode)
  if (propFeedId) {
    const propFeed = getFeedById(propFeedId);
    if (!propFeed) {
      return (
        <div className="app-error">
          <Alert variant="danger">Unknown feed: {propFeedId}</Alert>
        </div>
      );
    }
    return (
      <FeedView
        feed={propFeed}
        postId={route.postId}
        onNavigateToPost={handleNavigateToPost}
        onClearPostId={clearPostId}
      />
    );
  }

  // Get feed config from the registry
  const feed = route.feedId ? getFeedById(route.feedId) : null;

  if (!feed) {
    return <LandingPage onSelectFeed={handleSelectFeed} />;
  }

  return (
    <FeedView
      feed={feed}
      postId={route.postId}
      onBack={handleBack}
      onNavigateToPost={handleNavigateToPost}
      onClearPostId={clearPostId}
    />
  );
}

export default App;

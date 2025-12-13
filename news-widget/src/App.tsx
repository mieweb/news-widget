import { useState, useCallback } from 'react';
import { Feed, FullscreenViewer, LandingPage } from './components';
import { useFeed, useRouter } from './hooks';
import { getFeedById, type FeedConfig } from './data/feedRegistry';
import type { Post } from './types';
import './App.css';

interface FeedViewProps {
  feed: FeedConfig;
  postId: string | null;
  onBack: () => void;
  onNavigateToPost: (postId: string) => void;
  onClearPostId: () => void;
}

function FeedView({ feed, postId, onBack, onNavigateToPost, onClearPostId }: FeedViewProps) {
  const { posts, loading, error, refetch, toggleLike } = useFeed(feed.url);
  const [fullscreenPost, setFullscreenPost] = useState<Post | null>(null);

  const handleOpenFullscreen = useCallback((post: Post) => {
    setFullscreenPost(post);
    onNavigateToPost(post.id);
  }, [onNavigateToPost]);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenPost(null);
  }, []);

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
        <div className="spinner"></div>
        <p>Loading feed...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="app-error">
        <p>Failed to load feed: {error}</p>
        <button onClick={refetch} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <button onClick={onBack} className="back-button" aria-label="Back to channels">
          ←
        </button>
        <h1>📰 {feed.name}</h1>
        <button onClick={refetch} className="refresh-button" aria-label="Refresh feed">
          🔄
        </button>
      </header>

      <main className="app-main">
        <Feed
          posts={posts}
          onToggleLike={toggleLike}
          onOpenFullscreen={handleOpenFullscreen}
          scrollToPostId={postId}
          onScrolledToPost={onClearPostId}
        />
      </main>

      {fullscreenPost && fullscreenIndex >= 0 && (
        <FullscreenViewer
          posts={posts}
          initialIndex={fullscreenIndex}
          onClose={handleCloseFullscreen}
          onToggleLike={toggleLike}
        />
      )}
    </div>
  );
}

function App() {
  const { route, navigateToFeed, navigateToPost, navigateToLanding, clearPostId } = useRouter();

  const handleSelectFeed = useCallback((feedId: string) => {
    navigateToFeed(feedId);
  }, [navigateToFeed]);

  const handleBack = useCallback(() => {
    navigateToLanding();
  }, [navigateToLanding]);

  const handleNavigateToPost = useCallback((postId: string) => {
    if (route.feedId) {
      navigateToPost(route.feedId, postId);
    }
  }, [route.feedId, navigateToPost]);

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

import { useState, useCallback } from 'react';
import { Feed, FullscreenViewer, LandingPage } from './components';
import { useFeed } from './hooks';
import type { Post } from './types';
import './App.css';

interface SelectedFeed {
  url: string;
  name: string;
}

function FeedView({ feed, onBack }: { feed: SelectedFeed; onBack: () => void }) {
  const { posts, loading, error, refetch, toggleLike } = useFeed(feed.url);
  const [fullscreenPost, setFullscreenPost] = useState<Post | null>(null);

  const handleOpenFullscreen = useCallback((post: Post) => {
    setFullscreenPost(post);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenPost(null);
  }, []);

  const fullscreenIndex = fullscreenPost
    ? posts.findIndex((p) => p.id === fullscreenPost.id)
    : -1;

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
  const [selectedFeed, setSelectedFeed] = useState<SelectedFeed | null>(null);

  const handleSelectFeed = useCallback((url: string, name: string) => {
    setSelectedFeed({ url, name });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedFeed(null);
  }, []);

  if (!selectedFeed) {
    return <LandingPage onSelectFeed={handleSelectFeed} />;
  }

  return <FeedView feed={selectedFeed} onBack={handleBack} />;
}

export default App;

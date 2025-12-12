import { useState, useCallback } from 'react';
import { Feed, FullscreenViewer } from './components';
import { useFeed } from './hooks';
import type { Post } from './types';
import './App.css';

function App() {
  const { posts, loading, error, refetch, toggleLike } = useFeed();
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
        <h1>📰 News Feed</h1>
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

export default App;

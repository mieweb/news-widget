import React, { useEffect, useCallback, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { Post, FeedCapabilities } from '../types';
import { FeedCard } from './FeedCard';
import './FullscreenViewer.css';

interface FullscreenViewerProps {
  posts: Post[];
  initialIndex: number;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  /** Feed capabilities - controls which engagement features are shown */
  capabilities?: FeedCapabilities;
  /** Base URL for the feed source (e.g., Discourse instance) */
  feedBaseUrl?: string;
  /** Whether user is authenticated with Discourse */
  isAuthenticated?: boolean;
  /** Function to post comment to Discourse */
  postToDiscourse?: (topicId: number, content: string) => Promise<boolean>;
  /** Function to open login */
  onLogin?: () => void;
  /** Function to recheck login status */
  onCheckLogin?: () => void;
}

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  posts,
  initialIndex,
  onClose,
  onToggleLike,
  capabilities,
  feedBaseUrl,
  isAuthenticated,
  postToDiscourse,
  onLogin,
  onCheckLogin,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, posts.length - 1));
  }, [posts.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrev();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    onSwipedUp: goToNext,
    onSwipedDown: goToPrev,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const currentPost = posts[currentIndex];

  if (!currentPost) {
    return null;
  }

  return (
    <div className="fullscreen-viewer" {...swipeHandlers}>
      <div className="fullscreen-header">
        <button className="close-btn" onClick={onClose} aria-label="Close fullscreen">
          ✕
        </button>
        <span className="post-counter">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      <div className="fullscreen-content">
        <button
          className="nav-button nav-prev"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          aria-label="Previous post"
        >
          ‹
        </button>

        <div className="fullscreen-card-wrapper">
          <FeedCard
            post={currentPost}
            isActive={true}
            onToggleLike={onToggleLike}
            capabilities={capabilities}
            feedBaseUrl={feedBaseUrl}
            isAuthenticated={isAuthenticated}
            postToDiscourse={postToDiscourse}
            onLogin={onLogin}
            onCheckLogin={onCheckLogin}
          />
        </div>

        <button
          className="nav-button nav-next"
          onClick={goToNext}
          disabled={currentIndex === posts.length - 1}
          aria-label="Next post"
        >
          ›
        </button>
      </div>

      <div className="fullscreen-indicators">
        {posts.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to post ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

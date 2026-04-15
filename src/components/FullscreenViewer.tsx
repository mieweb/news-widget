import React, { useEffect, useCallback, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Button, CloseIcon } from '@mieweb/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    /** Feed ID for deep linking */
    feedId?: string;
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
    feedId,
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

  // Keep URL in sync with currently viewed post in fullscreen
  useEffect(() => {
    if (currentPost && feedId) {
      window.location.hash = `/feed/${feedId}/post/${currentPost.id}`;
    }
  }, [currentPost, feedId]);

  if (!currentPost) {
    return null;
  }

  return (
    <div className="fullscreen-viewer" role="dialog" aria-modal="true" aria-label="Fullscreen post viewer" {...swipeHandlers}>
      <div className="fullscreen-header">
        <Button variant="ghost" size="icon" className="close-btn" onClick={onClose} aria-label="Close fullscreen">
          <CloseIcon />
        </Button>
        <span className="post-counter" aria-live="polite" aria-atomic="true">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      <div className="fullscreen-content">
        <Button
          variant="ghost"
          size="icon"
          className="nav-button nav-prev"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          aria-label="Previous post"
        >
          <ChevronLeft size={32} />
        </Button>

        <div className="fullscreen-card-wrapper">
          <FeedCard
            post={currentPost}
            isActive={true}
            onToggleLike={onToggleLike}
            capabilities={capabilities}
            feedBaseUrl={feedBaseUrl}
                        feedId={feedId}
            isAuthenticated={isAuthenticated}
            postToDiscourse={postToDiscourse}
            onLogin={onLogin}
            onCheckLogin={onCheckLogin}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="nav-button nav-next"
          onClick={goToNext}
          disabled={currentIndex === posts.length - 1}
          aria-label="Next post"
        >
          <ChevronRight size={32} />
        </Button>
      </div>

      <div className="fullscreen-indicators">
        {posts.map((_, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to post ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

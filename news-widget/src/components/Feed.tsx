import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { Post, FeedCapabilities } from '../types';
import { FeedCard } from './FeedCard';
import './Feed.css';

interface FeedProps {
  posts: Post[];
  onToggleLike: (postId: string) => void;
  onOpenFullscreen: (post: Post) => void;
  scrollToPostId?: string | null;
  onScrolledToPost?: () => void;
  onNavigateToPost?: (postId: string) => void;
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

export const Feed: React.FC<FeedProps> = ({
  posts,
  onToggleLike,
  onOpenFullscreen,
  scrollToPostId,
  onScrolledToPost,
  onNavigateToPost,
  capabilities,
  feedBaseUrl,
    feedId,
  isAuthenticated,
  postToDiscourse,
  onLogin,
  onCheckLogin,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasScrolledToPost = useRef(false);

  // Handle scrolling to a specific post
  useEffect(() => {
    if (scrollToPostId && posts.length > 0 && !hasScrolledToPost.current) {
      const element = cardRefs.current.get(scrollToPostId);
      if (element) {
        hasScrolledToPost.current = true;
        // Use a slight delay to ensure layout is complete
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onScrolledToPost?.();
        });
      }
    }
  }, [scrollToPostId, posts, onScrolledToPost]);

  // Reset scroll tracking when scrollToPostId changes
  useEffect(() => {
    if (!scrollToPostId) {
      hasScrolledToPost.current = false;
    }
  }, [scrollToPostId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setActiveIndex(index);
            
            // Track active post only; do not change URL here to avoid auto-opening fullscreen
          }
        });
      },
      { threshold: 0.6, root: containerRef.current }
    );

    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [posts, onNavigateToPost, feedId]);

  const setCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  // Handle arrow key navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, posts.length - 1);
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        const nextPostId = posts[nextIndex].id;
        const nextElement = cardRefs.current.get(nextPostId);
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nextElement.focus();
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(activeIndex - 1, 0);
      if (prevIndex !== activeIndex) {
        setActiveIndex(prevIndex);
        const prevPostId = posts[prevIndex].id;
        const prevElement = cardRefs.current.get(prevPostId);
        if (prevElement) {
          prevElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          prevElement.focus();
        }
      }
    }
  }, [activeIndex, posts]);

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (posts.length === 0) {
    return (
      <div className="feed-empty">
        <p>No posts to display</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="feed-container">
      <div className="feed-list">
        {posts.map((post, index) => (
          <div
            key={post.id}
            data-index={index}
            data-post-id={post.id}
            className="feed-row"
          >
            <FeedCard
              ref={(el) => setCardRef(post.id, el)}
              post={post}
              isActive={index === activeIndex}
              onToggleLike={onToggleLike}
              onOpenFullscreen={onOpenFullscreen}
              capabilities={capabilities}
              feedBaseUrl={feedBaseUrl}
              feedId={feedId}
              isAuthenticated={isAuthenticated}
              postToDiscourse={postToDiscourse}
              onLogin={onLogin}
              onCheckLogin={onCheckLogin}
              feedIndex={index}
              feedLength={posts.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

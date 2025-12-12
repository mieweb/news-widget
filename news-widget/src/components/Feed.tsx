import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { Post } from '../types';
import { FeedCard } from './FeedCard';
import './Feed.css';

interface FeedProps {
  posts: Post[];
  onToggleLike: (postId: string) => void;
  onOpenFullscreen: (post: Post) => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, onToggleLike, onOpenFullscreen }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setActiveIndex(index);
          }
        });
      },
      { threshold: 0.6, root: containerRef.current }
    );

    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [posts]);

  const setCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

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
            ref={(el) => setCardRef(post.id, el)}
            data-index={index}
            className="feed-row"
          >
            <FeedCard
              post={post}
              isActive={index === activeIndex}
              onToggleLike={onToggleLike}
              onOpenFullscreen={onOpenFullscreen}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

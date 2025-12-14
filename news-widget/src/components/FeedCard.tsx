import React, { useRef, useCallback, useEffect, useState, forwardRef } from 'react';
import ReactPlayer from 'react-player';
import type { Post, FeedCapabilities } from '../types';
import { useVisibility } from '../hooks/useVisibility';
import { getPendingCommentCount } from '../hooks';
import { CommentsPanel } from './CommentsPanel';
import { Avatar } from './Avatar';
import './FeedCard.css';

/** Default capabilities when none are specified */
const DEFAULT_CAPABILITIES: FeedCapabilities = {
  supportsLikes: false,
  supportsComments: false,
};

interface FeedCardProps {
  post: Post;
  isActive?: boolean;
  onToggleLike: (postId: string) => void;
  onOpenFullscreen?: (post: Post) => void;
  /** Feed capabilities - controls which engagement features are shown */
  capabilities?: FeedCapabilities;
  /** Base URL for the feed source (e.g., Discourse instance) */
  feedBaseUrl?: string;
  /** Whether user is authenticated with Discourse */
  isAuthenticated?: boolean;
    /** Feed ID for deep linking */
    feedId?: string;
  /** Function to post comment to Discourse */
  postToDiscourse?: (topicId: number, content: string) => Promise<boolean>;
  /** Function to open login */
  onLogin?: () => void;
  /** Function to recheck login status */
  onCheckLogin?: () => void;
  /** Index in feed for keyboard navigation */
  feedIndex?: number;
  /** Total posts in feed for keyboard navigation */
  feedLength?: number;
}

export const FeedCard = forwardRef<HTMLDivElement, FeedCardProps>(({
  post,
  isActive = true,
  onToggleLike,
  onOpenFullscreen,
  capabilities = DEFAULT_CAPABILITIES,
  feedBaseUrl,
  isAuthenticated,
    feedId,
  postToDiscourse,
  onLogin,
  onCheckLogin,
  feedIndex = 0,
  feedLength = 1,
}, ref) => {
  const { supportsLikes, supportsComments } = capabilities;
  const [cardRef, isVisible] = useVisibility<HTMLDivElement>({ threshold: 0.6 });
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCaptionTruncated, setIsCaptionTruncated] = useState(false);
  // Initialize with the count of pending comments for this topic
  const [localCommentCount, setLocalCommentCount] = useState(() =>
    post.topicId ? getPendingCommentCount(post.topicId) : 0
  );
  const captionRef = useRef<HTMLElement>(null);
  const lastTapRef = useRef<number>(0);

  // Displayed comment count = server count + locally added comments
  const displayedCommentCount = (post.commentCount ?? 0) + localCommentCount;

  const handleCommentAdded = useCallback(() => {
    setLocalCommentCount(prev => prev + 1);
  }, []);

  const shouldPlay = isActive && isVisible && (post.mediaType === 'video' || post.mediaType === 'youtube');

  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

  // Detect if caption is truncated (works with -webkit-line-clamp)
  useEffect(() => {
    const checkTruncation = () => {
      if (captionRef.current) {
        const element = captionRef.current;
        // Clone the element to measure unclamped height
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.height = 'auto';
        clone.style.maxHeight = 'none';
        clone.style.webkitLineClamp = 'unset';
        clone.style.display = 'block';
        clone.style.width = `${element.clientWidth}px`;
        
        document.body.appendChild(clone);
        const fullHeight = clone.scrollHeight;
        document.body.removeChild(clone);
        
        const clampedHeight = element.clientHeight;
        setIsCaptionTruncated(fullHeight > clampedHeight + 2);
      }
    };
    // Run after a short delay to ensure CSS is applied
    const timer = setTimeout(checkTruncation, 100);
    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [post.caption, post.mediaType]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && supportsLikes) {
      onToggleLike(post.id);
      // Show heart animation
      const heart = document.createElement('div');
      heart.className = 'double-tap-heart';
      heart.innerHTML = '❤️';
      cardRef.current?.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    }
    lastTapRef.current = now;
  }, [onToggleLike, post.id, cardRef, supportsLikes]);



  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / 60000);
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderMedia = () => {
    switch (post.mediaType) {
      case 'youtube':
      case 'video':
        return (
          <div className="media-container media-video" onClick={handleDoubleTap}>
            <ReactPlayer
              src={post.mediaUrl}
              playing={isPlaying}
              muted={isMuted}
              loop
              width="100%"
              height="100%"
              playsInline
            />
            <button
              className="mute-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            {!isPlaying && (
              <button
                className="play-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                aria-label="Play video"
              >
                ▶️
              </button>
            )}
          </div>
        );

      case 'none':
        return (
          <div className="media-container media-caption" onClick={handleDoubleTap}>
            <div className={`caption-content ${isCaptionExpanded ? 'expanded' : ''}`}>
              <strong>{post.author.name}</strong>
              <p ref={captionRef as React.RefObject<HTMLParagraphElement>}>{post.caption}</p>
              {(isCaptionTruncated || isCaptionExpanded) && (
                <button
                  className="caption-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCaptionExpanded(!isCaptionExpanded);
                  }}
                  aria-label={isCaptionExpanded ? 'Show less' : 'Show more'}
                >
                  {isCaptionExpanded ? 'less' : '...more'}
                </button>
              )}
            </div>
          </div>
        );

      case 'image':
      default:
        return (
          <div className="media-container" onClick={handleDoubleTap}>
            <img
              src={post.mediaUrl}
              alt={post.caption}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.classList.add('media-placeholder');
                const placeholder = document.createElement('div');
                placeholder.className = 'placeholder-content';
                placeholder.innerHTML = '<span class="placeholder-icon">🖼️</span><span class="placeholder-text">Image not found</span>';
                target.parentElement?.appendChild(placeholder);
              }}
            />
          </div>
        );
    }
  };

  return (
    <div 
      ref={(el) => {
        // Support both the internal visibility ref and the forwarded ref
        if (cardRef && typeof cardRef === 'object') {
          if ('current' in cardRef) {
            cardRef.current = el;
          }
        }
        if (ref && typeof ref === 'object' && 'current' in ref) {
          ref.current = el;
        } else if (typeof ref === 'function') {
          ref(el);
        }
      }}
      className="feed-card"
      tabIndex={isActive ? 0 : -1}
      role="article"
      data-index={feedIndex}
      aria-label={`Post ${feedIndex + 1} of ${feedLength} by ${post.author.name}`}
    >
      {/* Header */}
      <div className="card-header">
        <Avatar
          name={post.author.name}
          src={post.author.avatar}
          size="medium"
          className="author-avatar"
        />
        <div className="author-info">
          <span className="author-name">{post.author.name}</span>
          <span className="post-time">{formatTimestamp(post.timestamp)}</span>
        </div>
        {onOpenFullscreen && (
          <button
            className="fullscreen-button"
            onClick={() => onOpenFullscreen(post)}
            aria-label="Open fullscreen"
          >
            ⛶
          </button>
        )}
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <div className="card-actions" role="toolbar" aria-label="Post actions">
        {supportsLikes && (
          <button
            className={`action-button ${post.isLiked ? 'liked' : ''}`}
            onClick={() => onToggleLike(post.id)}
            aria-label={`${post.isLiked ? 'Unlike' : 'Like'} post (${post.likes ?? 0} likes)`}
            aria-pressed={post.isLiked}
          >
            {post.isLiked ? '❤️' : '🤍'} {post.likes ?? '–'}
          </button>
        )}
        {supportsComments && (
          <button
            className="action-button"
            onClick={() => setShowComments(!showComments)}
            aria-label={`View comments (${displayedCommentCount} comments)`}
            aria-expanded={showComments}
          >
            💬 {post.commentCount === undefined ? '–' : displayedCommentCount}
          </button>
        )}
        {feedId && (
          <a
            href={`/#/feed/${feedId}/post/${post.id}`}
            className="action-button"
            aria-label="Zoom to post"
          >
            🔍 Zoom
          </a>
        )}
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button open-link"
            aria-label="Open article"
          >
            🔗 Open
          </a>
        )}
      </div>

      {/* Caption - only show if not already displayed in media area */}
      {post.mediaType !== 'none' && (
        <div className={`card-caption ${isCaptionExpanded ? 'expanded' : ''}`}>
          <strong>{post.author.name}</strong>
          <span ref={captionRef as React.RefObject<HTMLSpanElement>} className="caption-text">{post.caption}</span>
          {(isCaptionTruncated || isCaptionExpanded) && (
            <button
              className="caption-toggle"
              onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
              aria-label={isCaptionExpanded ? 'Show less' : 'Show more'}
            >
              {isCaptionExpanded ? 'less' : '...more'}
            </button>
          )}
        </div>
      )}

      {/* Comments Panel */}
      {supportsComments && showComments && (
        <CommentsPanel
          postId={post.id}
          onClose={() => setShowComments(false)}
          topicId={post.topicId}
          discourseBaseUrl={feedBaseUrl}
          onCommentAdded={handleCommentAdded}
          isAuthenticated={isAuthenticated}
          postToDiscourse={postToDiscourse}
          onLogin={onLogin}
          onCheckLogin={onCheckLogin}
        />
      )}
    </div>
  );
});

FeedCard.displayName = 'FeedCard';

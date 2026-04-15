import React, { useRef, useCallback, useEffect, useState, forwardRef } from 'react';
import ReactPlayer from 'react-player';
import { Button, Card, CardHeader, CardActions } from '@mieweb/ui';
import { VolumeX, Volume2, Play, Maximize, Heart, MessageCircle, Search, ExternalLink } from 'lucide-react';
import type { Post, FeedCapabilities } from '../types';
import { useVisibility } from '../hooks/useVisibility';
import { getPendingCommentCount } from '../hooks';
import { formatTimestamp, formatTimestampFull } from '../utils';
import { CommentsPanel } from './CommentsPanel';
import { Avatar } from './Avatar';
import { ClickTooltip } from './ClickTooltip';
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
      heart.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="red" stroke="red" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
      cardRef.current?.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    }
    lastTapRef.current = now;
  }, [onToggleLike, post.id, cardRef, supportsLikes]);

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
            <Button
              variant="ghost"
              size="icon"
              className="mute-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            {!isPlaying && (
              <Button
                variant="ghost"
                size="icon"
                className="play-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                aria-label="Play video"
              >
                <Play size={48} />
              </Button>
            )}
          </div>
        );

      case 'none':
        return (
          <div className="media-container media-caption" onClick={handleDoubleTap}>
            <div className={`caption-content ${isCaptionExpanded ? 'expanded' : ''}`}>
              <Avatar
                name={post.author.name}
                src={post.author.avatar}
                size="small"
                className="caption-avatar"
              />
              <div className="caption-text-wrapper">
                <div className="caption-author-line">
                  <strong className="author-name">{post.author.name}</strong>
                  {post.author.title && <span className="author-title">{post.author.title}</span>}
                  <ClickTooltip
                    content={formatTimestampFull(post.timestamp)}
                    className="post-time"
                    ariaLabel={`Posted ${formatTimestampFull(post.timestamp)}`}
                  >
                    {formatTimestamp(post.timestamp)}
                  </ClickTooltip>
                </div>
                <p ref={captionRef as React.RefObject<HTMLParagraphElement>}>{post.caption}</p>
                {(isCaptionTruncated || isCaptionExpanded) && (
                  <Button
                    variant="link"
                    size="sm"
                    className="caption-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCaptionExpanded(!isCaptionExpanded);
                    }}
                    aria-label={isCaptionExpanded ? 'Show less' : 'Show more'}
                  >
                    {isCaptionExpanded ? 'less' : '...more'}
                  </Button>
                )}
              </div>
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
                placeholder.innerHTML = '<span class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><path d="M18 12 6 21"/><path d="m2 8 20 13"/><path d="M21 15V5a2 2 0 0 0-2-2H5"/></svg></span><span class="placeholder-text">Image not found</span>';
                target.parentElement?.appendChild(placeholder);
              }}
            />
          </div>
        );
    }
  };

  return (
    <Card
      as="article"
      variant="elevated"
      padding="none" 
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
      data-index={feedIndex}
      aria-label={`Post ${feedIndex + 1} of ${feedLength} by ${post.author.name}`}
    >
      {/* Header - Post Title */}
      <CardHeader className="card-header">
        <h2 className="post-title">{post.title || post.caption}</h2>
        {onOpenFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="fullscreen-button"
            onClick={() => onOpenFullscreen(post)}
            aria-label="Open fullscreen"
          >
            <Maximize size={18} />
          </Button>
        )}
      </CardHeader>

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <CardActions className="card-actions" role="toolbar" aria-label="Post actions">
        {supportsLikes && (
          <Button
            variant="ghost"
            size="sm"
            className={`action-button ${post.isLiked ? 'liked' : ''}`}
            onClick={() => onToggleLike(post.id)}
            aria-label={`${post.isLiked ? 'Unlike' : 'Like'} post (${post.likes ?? 0} likes)`}
            aria-pressed={post.isLiked}
          >
            <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.likes ?? '–'}
          </Button>
        )}
        {supportsComments && (
          <Button
            variant="ghost"
            size="sm"
            className="action-button"
            onClick={() => setShowComments(!showComments)}
            aria-label={`View comments (${displayedCommentCount} comments)`}
            aria-expanded={showComments}
          >
            <MessageCircle size={16} /> {post.commentCount === undefined ? '–' : displayedCommentCount}
          </Button>
        )}
        {feedId && (
          <a
            href={`/#/feed/${feedId}/post/${post.id}`}
            className="action-button"
            aria-label="Zoom to post"
          >
            <Search size={16} /> Zoom
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
            <ExternalLink size={16} /> Open
          </a>
        )}
      </CardActions>

      {/* Caption with author info */}
      {post.mediaType !== 'none' && (
        <div className={`card-caption ${isCaptionExpanded ? 'expanded' : ''}`}>
          <Avatar
            name={post.author.name}
            src={post.author.avatar}
            size="small"
            className="caption-avatar"
          />
          <div className="caption-content-wrapper">
            <div className="caption-author-line">
              <strong className="author-name">{post.author.name}</strong>
              {post.author.title && <span className="author-title">{post.author.title}</span>}
              <ClickTooltip
                content={formatTimestampFull(post.timestamp)}
                className="post-time"
                ariaLabel={`Posted ${formatTimestampFull(post.timestamp)}`}
              >
                {formatTimestamp(post.timestamp)}
              </ClickTooltip>
            </div>
            <span ref={captionRef as React.RefObject<HTMLSpanElement>} className="caption-text">{post.caption}</span>
            {(isCaptionTruncated || isCaptionExpanded) && (
              <Button
                variant="link"
                size="sm"
                className="caption-toggle"
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                aria-label={isCaptionExpanded ? 'Show less' : 'Show more'}
              >
                {isCaptionExpanded ? 'less' : '...more'}
              </Button>
            )}
          </div>
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
    </Card>
  );
});

FeedCard.displayName = 'FeedCard';
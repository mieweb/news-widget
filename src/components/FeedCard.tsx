import React, { useRef, useCallback, useEffect, useState, forwardRef } from 'react';
import ReactPlayer from 'react-player';
import { Button, Card, CardHeader, CardActions, Avatar } from '@mieweb/ui';
import { VolumeX, Volume2, Play, Maximize, Heart, MessageCircle, Search, ExternalLink, ImageOff } from 'lucide-react';
import type { Post, FeedCapabilities } from '../types';
import { useVisibility } from '../hooks/useVisibility';
import { getPendingCommentCount } from '../hooks';
import { formatTimestamp, formatTimestampFull } from '../utils';
import { CommentsPanel } from './CommentsPanel';
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
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);
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
        // Use a line-height-based threshold to avoid false positives from
        // minor box model differences between clamped and unclamped rendering
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
        setIsCaptionTruncated(fullHeight > clampedHeight + lineHeight * 0.5);
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
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  }, [onToggleLike, post.id, supportsLikes]);

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
                size="sm"
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
            {!imageError ? (
              <img
                src={post.mediaUrl}
                alt={post.caption}
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="media-placeholder">
                <div className="placeholder-content">
                  <span className="placeholder-icon"><ImageOff size={48} /></span>
                  <span className="placeholder-text">Image not found</span>
                </div>
              </div>
            )}
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

      {/* Double-tap heart animation */}
      {showHeartAnimation && (
        <div className="double-tap-heart" aria-hidden="true">
          <Heart size={80} fill="red" stroke="red" />
        </div>
      )}

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
            size="sm"
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
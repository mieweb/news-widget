import React, { useRef, useCallback, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import type { Post } from '../types';
import { useVisibility } from '../hooks/useVisibility';
import { CommentsPanel } from './CommentsPanel';
import { Avatar } from './Avatar';
import './FeedCard.css';

interface FeedCardProps {
  post: Post;
  isActive?: boolean;
  onToggleLike: (postId: string) => void;
  onOpenFullscreen?: (post: Post) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  post,
  isActive = true,
  onToggleLike,
  onOpenFullscreen,
}) => {
  const [cardRef, isVisible] = useVisibility<HTMLDivElement>({ threshold: 0.6 });
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastTapRef = useRef<number>(0);

  const shouldPlay = isActive && isVisible && (post.mediaType === 'video' || post.mediaType === 'youtube');

  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onToggleLike(post.id);
      // Show heart animation
      const heart = document.createElement('div');
      heart.className = 'double-tap-heart';
      heart.innerHTML = '❤️';
      cardRef.current?.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    }
    lastTapRef.current = now;
  }, [onToggleLike, post.id, cardRef]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: post.caption,
      text: `Check out this post by ${post.author.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, [post]);

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
          <div className="media-container" onClick={handleDoubleTap}>
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
          <div className="media-container media-placeholder" onClick={handleDoubleTap}>
            <div className="placeholder-content">
              <span className="placeholder-icon">📰</span>
              <span className="placeholder-text">No media</span>
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
    <div ref={cardRef} className="feed-card">
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
      <div className="card-actions">
        <button
          className={`action-button ${post.isLiked ? 'liked' : ''}`}
          onClick={() => onToggleLike(post.id)}
          aria-label={post.isLiked ? 'Unlike' : 'Like'}
        >
          {post.isLiked ? '❤️' : '🤍'} {post.likes}
        </button>
        <button
          className="action-button"
          onClick={() => setShowComments(!showComments)}
          aria-label="Comments"
        >
          💬 {post.commentCount}
        </button>
        <button className="action-button" onClick={handleShare} aria-label="Share">
          📤 Share
        </button>
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

      {/* Caption */}
      <div className="card-caption">
        <strong>{post.author.name}</strong> {post.caption}
      </div>

      {/* Comments Panel */}
      {showComments && (
        <CommentsPanel postId={post.id} onClose={() => setShowComments(false)} />
      )}
    </div>
  );
};

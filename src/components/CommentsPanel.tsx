import React, { useState, useEffect, useRef } from 'react';
import { useComments, type UseCommentsOptions } from '../hooks/useComments';
import { formatTimestampCompact, formatTimestampFull } from '../utils';
import { Avatar } from './Avatar';
import { ClickTooltip } from './ClickTooltip';
import './CommentsPanel.css';

interface CommentsPanelProps {
  postId: string;
  onClose: () => void;
  /** Discourse topic ID for fetching real comments */
  topicId?: number;
  /** Base URL for the Discourse instance */
  discourseBaseUrl?: string;
  /** Callback when a comment is added (for updating counts) */
  onCommentAdded?: () => void;
  /** Whether user is authenticated with Discourse */
  isAuthenticated?: boolean;
  /** Function to post to Discourse */
  postToDiscourse?: (topicId: number, content: string) => Promise<boolean>;
  /** Function to open login */
  onLogin?: () => void;
  /** Function to recheck login status */
  onCheckLogin?: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  postId,
  onClose,
  topicId,
  discourseBaseUrl,
  onCommentAdded,
  isAuthenticated = false,
  postToDiscourse,
  onLogin,
  onCheckLogin,
}) => {
  const options: UseCommentsOptions = {
    topicId,
    discourseBaseUrl,
    onCommentAdded,
    isAuthenticated,
    postToDiscourse,
  };
  const { comments, loading, fetchComments, addComment, retryComment } = useComments(postId, options);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Refetch comments when auth status changes (to pick up synced pending comments)
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to let syncPendingComments finish
      const timer = setTimeout(() => {
        fetchComments();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchComments]);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (commentsListRef.current) {
      commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (commentId: string) => {
    await retryComment(commentId);
  };

  return (
    <div className="comments-panel" role="region" aria-label="Comments section">
      <div className="comments-header">
        <h2>Comments</h2>
        <button className="close-button" onClick={onClose} aria-label="Close comments">
          ✕
        </button>
      </div>

      <div className="comments-list" ref={commentsListRef} role="list" aria-label="Comments list">
        {loading ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first!</div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`comment-item ${comment.status === 'pending' ? 'comment-pending' : ''}`}
              role="listitem"
              aria-label={`Comment from ${comment.author.name}: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`}
            >
              <Avatar
                name={comment.author.name}
                src={comment.author.avatar}
                size="small"
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-text">
                  <strong>{comment.author.name}</strong> {comment.content}
                </div>
                <div className="comment-meta">
                  <ClickTooltip
                    content={formatTimestampFull(comment.timestamp)}
                    className="comment-time"
                  >
                    {formatTimestampCompact(comment.timestamp)}
                  </ClickTooltip>
                  {comment.status === 'pending' && (
                    <span className="comment-status pending" role="status" aria-live="polite">
                      ⏳ Pending
                      {isAuthenticated && (
                        <button
                          type="button"
                          className="retry-button"
                          onClick={() => handleRetry(comment.id)}
                          aria-label="Retry sending comment"
                        >
                          Retry
                        </button>
                      )}
                      {!isAuthenticated && onLogin && (
                        <button
                          type="button"
                          className="login-to-sync-button"
                          onClick={onLogin}
                          aria-label="Login to sync comment"
                        >
                          Login to sync
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={handleSubmit} aria-label="Add new comment">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Add a comment..." : "Add a comment (pending until login)..."}
          className="comment-input"
          disabled={isSubmitting}
          aria-label="Comment input field"
          aria-describedby={!isAuthenticated ? "pending-note" : undefined}
        />
        <button
          type="submit"
          className="comment-submit"
          disabled={!newComment.trim() || isSubmitting}
          aria-label="Post comment"
        >
          Post
        </button>
      </form>
      
      {!isAuthenticated && onLogin && (
        <div className="login-prompt" role="region" aria-label="Login required" id="pending-note">
          <button type="button" className="login-button" onClick={onLogin} aria-label="Login to Discourse">
            Login to Discourse
          </button>
          {onCheckLogin && (
            <button type="button" className="check-login-button" onClick={onCheckLogin} aria-label="Check if logged in">
              Check login
            </button>
          )}
          <span className="login-hint">to sync your comments</span>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useComments, type UseCommentsOptions } from '../hooks/useComments';
import { Avatar } from './Avatar';
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

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes}m` : 'now';
  };

  const handleRetry = async (commentId: string) => {
    await retryComment(commentId);
  };

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h3>Comments</h3>
        <button className="close-button" onClick={onClose} aria-label="Close comments">
          ✕
        </button>
      </div>

      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first!</div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`comment-item ${comment.status === 'pending' ? 'comment-pending' : ''}`}
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
                  <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                  {comment.status === 'pending' && (
                    <span className="comment-status pending">
                      ⏳ Pending
                      {isAuthenticated && (
                        <button
                          type="button"
                          className="retry-button"
                          onClick={() => handleRetry(comment.id)}
                        >
                          Retry
                        </button>
                      )}
                      {!isAuthenticated && onLogin && (
                        <button
                          type="button"
                          className="login-to-sync-button"
                          onClick={onLogin}
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

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Add a comment..." : "Add a comment (pending until login)..."}
          className="comment-input"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="comment-submit"
          disabled={!newComment.trim() || isSubmitting}
        >
          Post
        </button>
      </form>
      
      {!isAuthenticated && onLogin && (
        <div className="login-prompt">
          <button type="button" className="login-button" onClick={onLogin}>
            Login to Discourse
          </button>
          {onCheckLogin && (
            <button type="button" className="check-login-button" onClick={onCheckLogin}>
              Check login
            </button>
          )}
          <span className="login-hint">to sync your comments</span>
        </div>
      )}
    </div>
  );
};

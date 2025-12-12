import React, { useState, useEffect } from 'react';
import { useComments } from '../hooks/useComments';
import './CommentsPanel.css';

interface CommentsPanelProps {
  postId: string;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ postId, onClose }) => {
  const { comments, loading, fetchComments, addComment } = useComments(postId);
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
            <div key={comment.id} className="comment-item">
              <img
                src={comment.author.avatar || 'https://ui-avatars.com/api/?name=User'}
                alt={comment.author.name}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-text">
                  <strong>{comment.author.name}</strong> {comment.content}
                </div>
                <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
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
          placeholder="Add a comment..."
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
    </div>
  );
};

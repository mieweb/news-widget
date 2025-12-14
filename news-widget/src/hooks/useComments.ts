import { useState, useCallback } from 'react';
import type { Comment } from '../types';
import {
  getPendingCommentsForTopic,
  addPendingComment,
  removePendingComment,
  getPendingCommentCount,
  type PendingComment,
} from './useDiscourseAuth';
import { getDiscourseBaseUrl, isDemoFeed } from './proxyConfig';

/**
 * Discourse post in the post_stream (represents a reply/comment)
 */
interface DiscoursePost {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
  cooked: string;
  created_at: string;
  post_number: number;
}

/**
 * Discourse topic API response (partial)
 */
interface DiscourseTopicResponse {
  post_stream: {
    posts: DiscoursePost[];
  };
}

/**
 * Strip HTML tags from Discourse cooked content
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Build avatar URL from Discourse template
 */
function buildAvatarUrl(template: string, baseUrl: string, size = 48): string {
  if (!template) return '';
  const avatarPath = template.replace('{size}', String(size));
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${baseUrl}${avatarPath}`;
}

/**
 * Fetch comments from Discourse API
 */
async function fetchDiscourseComments(
  topicId: number,
  feedUrl: string
): Promise<Comment[]> {
  // Skip fetch for demo feeds (non-HTTP schemes)
  if (isDemoFeed(feedUrl)) {
    return [];
  }

  // Get the API base URL (proxied in dev, direct in prod)
  const apiBaseUrl = getDiscourseBaseUrl(feedUrl);
  const apiUrl = `${apiBaseUrl}/t/${topicId}.json`;

  // For building avatar URLs, we need the original base URL
  let originalBaseUrl = feedUrl;
  try {
    const parsed = new URL(feedUrl);
    originalBaseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // Keep as-is
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return [];

    const data: DiscourseTopicResponse = await response.json();
    const posts = data.post_stream?.posts || [];

    // Skip the first post (original topic), only get replies
    const replies = posts.slice(1);

    return replies.map((post) => ({
      id: String(post.id),
      postId: String(topicId),
      author: {
        name: post.name || post.username,
        avatar: buildAvatarUrl(post.avatar_template, originalBaseUrl),
      },
      content: stripHtml(post.cooked),
      timestamp: new Date(post.created_at),
      status: 'synced' as const,
    }));
  } catch (err) {
    console.warn(`Failed to fetch Discourse comments for topic ${topicId}:`, err);
    return [];
  }
}

/**
 * Convert pending comment to Comment for display
 */
function pendingToComment(pending: PendingComment): Comment {
  return {
    id: pending.id,
    postId: String(pending.topicId),
    author: { name: 'You' },
    content: pending.content,
    timestamp: pending.timestamp,
    status: 'pending',
  };
}

export interface UseCommentsOptions {
  /** Discourse topic ID for fetching real comments */
  topicId?: number;
  /** Base URL for the Discourse instance */
  discourseBaseUrl?: string;
  /** Callback when a comment is added (for updating counts) */
  onCommentAdded?: () => void;
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Function to post comment to Discourse */
  postToDiscourse?: (topicId: number, content: string) => Promise<boolean>;
}

/**
 * Get count of pending comments for a specific topic
 * Exported for use in FeedCard to show pending count
 */
export { getPendingCommentCount };

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const {
    topicId,
    discourseBaseUrl,
    onCommentAdded,
    isAuthenticated = false,
    postToDiscourse,
  } = options;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);

    try {
      let fetchedComments: Comment[] = [];
      
      // Fetch from Discourse API if we have topic info
      if (topicId && discourseBaseUrl) {
        fetchedComments = await fetchDiscourseComments(topicId, discourseBaseUrl);
      }
      
      // Add any pending comments for this topic
      if (topicId) {
        const pendingComments = getPendingCommentsForTopic(topicId);
        const pendingAsComments = pendingComments.map(pendingToComment);
        fetchedComments = [...fetchedComments, ...pendingAsComments];
      }
      
      // Sort by timestamp
      fetchedComments.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setComments(fetchedComments);
    } finally {
      setLoading(false);
    }
  }, [topicId, discourseBaseUrl]);

  const addComment = useCallback(
    async (content: string) => {
      if (!topicId) return null;

      const commentId = `comment-${Date.now()}`;

      // If authenticated, try to post directly to Discourse
      if (isAuthenticated && postToDiscourse) {
        const success = await postToDiscourse(topicId, content);
        
        if (success) {
          // Refresh comments to get the server version
          await fetchComments();
          onCommentAdded?.();
          return null; // Comment will be in fetched results
        }
        // If failed, fall through to pending
      }

      // Create as pending comment (for real Discourse feeds)
      const pendingComment: PendingComment = {
        id: commentId,
        topicId,
        content,
        timestamp: new Date(),
      };

      // Save to localStorage
      addPendingComment(pendingComment);

      // Add to local state for immediate display
      const newComment: Comment = pendingToComment(pendingComment);
      setComments(prev => [...prev, newComment]);
      
      // Notify parent to update count
      onCommentAdded?.();
      
      return newComment;
    },
    [topicId, isAuthenticated, postToDiscourse, fetchComments, onCommentAdded]
  );

  /**
   * Retry syncing a specific pending comment
   */
  const retryComment = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated || !postToDiscourse || !topicId) return false;

      const pendingComments = getPendingCommentsForTopic(topicId);
      const comment = pendingComments.find(c => c.id === commentId);
      
      if (!comment) return false;

      const success = await postToDiscourse(topicId, comment.content);
      
      if (success) {
        // Remove from localStorage
        removePendingComment(commentId);
        // Remove from local state immediately
        setComments(prev => prev.filter(c => c.id !== commentId));
        // Fetch fresh comments from server
        await fetchComments();
        return true;
      }
      
      return false;
    },
    [topicId, isAuthenticated, postToDiscourse, fetchComments]
  );

  return { comments, loading, fetchComments, addComment, retryComment };
}

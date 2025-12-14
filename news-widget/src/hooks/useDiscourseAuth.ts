import { useState, useCallback, useEffect } from 'react';
import type { DiscourseUser } from '../types';
import { getDiscourseBaseUrl, isDemoFeed, isTestServerUrl } from './proxyConfig';

// LocalStorage key for pending comments
const PENDING_COMMENTS_KEY = 'news-widget-pending-comments';

export interface PendingComment {
  id: string;
  topicId: number;
  content: string;
  timestamp: Date;
}

/**
 * Load pending comments from localStorage
 */
export function loadPendingComments(): PendingComment[] {
  try {
    const stored = localStorage.getItem(PENDING_COMMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PendingComment[];
      return parsed.map(c => ({ ...c, timestamp: new Date(c.timestamp) }));
    }
  } catch (err) {
    console.warn('Failed to load pending comments:', err);
  }
  return [];
}

/**
 * Save pending comments to localStorage
 */
export function savePendingComments(comments: PendingComment[]): void {
  try {
    localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(comments));
  } catch (err) {
    console.warn('Failed to save pending comments:', err);
  }
}

/**
 * Remove a pending comment by ID
 */
export function removePendingComment(id: string): void {
  const pending = loadPendingComments();
  const filtered = pending.filter(c => c.id !== id);
  savePendingComments(filtered);
}

/**
 * Add a pending comment
 */
export function addPendingComment(comment: PendingComment): void {
  const pending = loadPendingComments();
  pending.push(comment);
  savePendingComments(pending);
}

/**
 * Get pending comments for a specific topic
 */
export function getPendingCommentsForTopic(topicId: number): PendingComment[] {
  return loadPendingComments().filter(c => c.topicId === topicId);
}

/**
 * Get count of pending comments for a specific topic
 */
export function getPendingCommentCount(topicId: number): number {
  return getPendingCommentsForTopic(topicId).length;
}

interface DiscourseSessionResponse {
  current_user?: DiscourseUser;
}

export interface UseDiscourseAuthResult {
  /** Currently logged in user, or null */
  user: DiscourseUser | null;
  /** Whether we're checking auth status */
  loading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Check current session status */
  checkSession: () => Promise<void>;
  /** Open login in new window */
  openLogin: () => void;
  /** Logout (test server only) */
  logout: () => Promise<void>;
  /** Post a comment to Discourse */
  postComment: (topicId: number, content: string) => Promise<boolean>;
  /** Sync all pending comments */
  syncPendingComments: () => Promise<void>;
  /** The base URL for the Discourse instance */
  baseUrl: string;
}

/**
 * Hook to manage Discourse authentication and posting
 */
export function useDiscourseAuth(discourseBaseUrl: string): UseDiscourseAuthResult {
  const [user, setUser] = useState<DiscourseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Build API URL, using proxy in development
   */
  const buildApiUrl = useCallback((path: string): string => {
    // Skip for demo feeds
    if (isDemoFeed(discourseBaseUrl)) {
      return '';
    }
    const apiBase = getDiscourseBaseUrl(discourseBaseUrl);
    return `${apiBase}${path}`;
  }, [discourseBaseUrl]);

  /**
   * Check if user has an active Discourse session
   */
  const checkSession = useCallback(async () => {
    // Skip for demo feeds
    if (isDemoFeed(discourseBaseUrl)) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/session/current.json'), {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data: DiscourseSessionResponse = await response.json();
        setUser(data.current_user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to check Discourse session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl, discourseBaseUrl]);

  /**
   * Open Discourse login page in a new window
   * For test server, directly authenticate via API
   */
  const openLogin = useCallback(async () => {
    // For test server, use the test login endpoint directly
    if (discourseBaseUrl === '/api/test') {
      try {
        const response = await fetch('/api/test/test/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', name: 'Test User' }),
        });
        if (response.ok) {
          await checkSession();
        }
      } catch (err) {
        console.warn('Test login failed:', err);
      }
      return;
    }

    // For real Discourse, open login popup
    const loginUrl = `${discourseBaseUrl}/login`;
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      loginUrl,
      'discourse-login',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    // Poll for popup close and recheck session
    if (popup) {
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          checkSession();
        }
      }, 500);
    }
  }, [discourseBaseUrl, checkSession]);

  /**
   * Post a comment to Discourse
   */
  const postComment = useCallback(async (topicId: number, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(buildApiUrl('/posts.json'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_id: topicId,
          raw: content,
        }),
      });

      return response.ok;
    } catch (err) {
      console.error('Failed to post comment to Discourse:', err);
      return false;
    }
  }, [user, buildApiUrl]);

  /**
   * Sync all pending comments to Discourse
   */
  const syncPendingComments = useCallback(async () => {
    if (!user) return;

    const pending = loadPendingComments();
    const results = await Promise.allSettled(
      pending.map(async (comment) => {
        const success = await postComment(comment.topicId, comment.content);
        if (success) {
          removePendingComment(comment.id);
        }
        return { id: comment.id, success };
      })
    );

    const synced = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    if (synced > 0) {
      console.log(`Synced ${synced} pending comments to Discourse`);
    }
  }, [user, postComment]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Recheck session when window gains focus (user may have logged in another tab)
  useEffect(() => {
    const handleFocus = () => {
      checkSession();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSession]);

  // Sync pending comments when user becomes authenticated
  useEffect(() => {
    if (user) {
      syncPendingComments();
    }
  }, [user, syncPendingComments]);

  /**
   * Logout (test server only)
   */
  const logout = useCallback(async () => {
    // Only works for test server
    if (discourseBaseUrl === '/api/test') {
      try {
        const response = await fetch('/api/test/test/logout', {
          method: 'POST',
        });
        if (response.ok) {
          setUser(null);
        }
      } catch (err) {
        console.warn('Test logout failed:', err);
      }
    }
  }, [discourseBaseUrl]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    checkSession,
    openLogin,
    logout,
    postComment,
    syncPendingComments,
    baseUrl: discourseBaseUrl,
  };
}

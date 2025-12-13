import { useState, useEffect, useCallback } from 'react';

export interface Route {
  feedId: string | null;
  postId: string | null;
}

/**
 * Parses the current URL hash to extract route info.
 * Supports formats:
 * - #/ or #/feed - landing page
 * - #/feed/:feedId - specific feed
 * - #/feed/:feedId/post/:postId - specific post in a feed
 */
function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'feed')) {
    return { feedId: null, postId: null };
  }

  // Format: feed/:feedId or feed/:feedId/post/:postId
  if (segments[0] === 'feed' && segments.length >= 2) {
    const feedId = segments[1];
    const postId = segments[3] && segments[2] === 'post' ? segments[3] : null;
    return { feedId, postId };
  }

  // Legacy format: /:feedId or /:feedId/post/:postId
  if (segments.length >= 1) {
    const feedId = segments[0];
    const postId = segments[2] && segments[1] === 'post' ? segments[2] : null;
    return { feedId, postId };
  }

  return { feedId: null, postId: null };
}

/**
 * Custom hook for hash-based routing.
 * Provides navigation functions and current route state.
 */
export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToFeed = useCallback((feedId: string) => {
    window.location.hash = `/feed/${feedId}`;
  }, []);

  const navigateToPost = useCallback((feedId: string, postId: string) => {
    window.location.hash = `/feed/${feedId}/post/${postId}`;
  }, []);

  const navigateToLanding = useCallback(() => {
    window.location.hash = '/';
  }, []);

  const clearPostId = useCallback(() => {
    if (route.feedId) {
      window.location.hash = `/feed/${route.feedId}`;
    }
  }, [route.feedId]);

  return {
    route,
    navigateToFeed,
    navigateToPost,
    navigateToLanding,
    clearPostId,
  };
}

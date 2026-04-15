/**
 * Proxy configuration for development
 * 
 * Maps external hosts to their local proxy paths.
 * These must match the proxy config in vite.config.ts
 */

export const PROXY_CONFIG: Record<string, string> = {
  // Production Discourse server
  'community.enterprise.health': '/api/rss',
  // Embedded test server (Vite plugin handles /api/test/*)
  'localhost:5173': '',
};

/**
 * Check if a URL should use the dev proxy
 */
export function shouldUseProxy(url: string): boolean {
  if (!import.meta.env.DEV) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.host in PROXY_CONFIG;
  } catch {
    return false;
  }
}

/**
 * Check if URL is for the embedded test server
 */
export function isTestServerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.host === 'localhost:5173' && parsed.pathname.startsWith('/api/test');
  } catch {
    return false;
  }
}

/**
 * Get the proxied URL for development
 * Returns the original URL if not in dev or not a proxied host
 */
export function getProxiedUrl(url: string): string {
  if (!import.meta.env.DEV) return url;
  
  // Test server URLs are already on the right host
  if (isTestServerUrl(url)) {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  }
  
  try {
    const parsed = new URL(url);
    const proxyPath = PROXY_CONFIG[parsed.host];
    
    if (proxyPath) {
      return `${proxyPath}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Invalid URL, return as-is
  }
  
  return url;
}

/**
 * Get the base URL for Discourse API calls
 * In dev, this returns the proxy path; in prod, returns the original host
 */
export function getDiscourseBaseUrl(feedUrl: string): string {
  try {
    const parsed = new URL(feedUrl);
    
    // Test server - already a local path
    if (isTestServerUrl(feedUrl)) {
      return '/api/test';
    }
    
    if (import.meta.env.DEV && parsed.host in PROXY_CONFIG) {
      return PROXY_CONFIG[parsed.host];
    }
    
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return feedUrl;
  }
}

/**
 * Check if a URL is for a demo/sample feed (non-HTTP scheme)
 */
export function isDemoFeed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return !parsed.protocol.startsWith('http');
  } catch {
    return false;
  }
}

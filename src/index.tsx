/**
 * News Widget Library Entry Point
 * 
 * Use this to embed the Instagram-style news feed widget into your React application.
 * 
 * @example
 * ```tsx
 * import { NewsWidget, renderNewsWidget } from '@mieweb/news-widget';
 * import '@mieweb/news-widget/dist/style.css';
 * 
 * // As a React component
 * function App() {
 *   return <NewsWidget />;
 * }
 * 
 * // Or render into a specific element
 * renderNewsWidget(document.getElementById('news-feed'));
 * ```
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import type { AppProps } from './App';

// Export the main App component as NewsWidget
export { default as NewsWidget } from './App';
export type { AppProps } from './App';

// Export individual components for advanced usage
export { Feed, FeedCard, FullscreenViewer, CommentsPanel } from './components';

// Export hooks for custom implementations
export { useFeed, useComments, useVisibility, useRouter, useDiscourseAuth } from './hooks';

// Export feed registry utilities
export { registerFeed } from './data/feedRegistry';

// Export types
export type { Post, Comment, MediaType, FeedCapabilities, FeedState, DiscourseUser, CommentStatus } from './types';
export type { FeedConfig } from './data/feedRegistry';

/**
 * Render the news widget into a DOM element
 * 
 * @param element - The DOM element to render into (must have id="root" or provide custom element)
 * @param props - Optional props to pass to the App component
 * 
 * @example
 * ```js
 * import { renderNewsWidget } from '@mieweb/news-widget';
 * import '@mieweb/news-widget/dist/style.css';
 * 
 * renderNewsWidget(document.getElementById('news-feed'));
 * ```
 */
export function renderNewsWidget(element: HTMLElement, props: AppProps = {}) {
  if (!element) {
    throw new Error('renderNewsWidget: element is required');
  }
  
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App {...props} />
    </StrictMode>
  );
  
  return root;
}

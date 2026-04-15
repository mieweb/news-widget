# Example Usage

This directory contains example implementations of the News Widget.

## React App Example

```tsx
// App.tsx
import { NewsWidget } from '@mieweb/news-widget';
import '@mieweb/news-widget/style.css';

export default function App() {
  return (
    <div>
      <header>
        <h1>My News Site</h1>
      </header>
      <main>
        <NewsWidget />
      </main>
    </div>
  );
}
```

## Next.js Example

```tsx
// pages/index.tsx or app/page.tsx
'use client'; // For Next.js 13+ App Router

import { NewsWidget } from '@mieweb/news-widget';
import '@mieweb/news-widget/dist/style.css';

export default function Home() {
  return (
    <div>
      <h1>Latest News</h1>
      <NewsWidget />
    </div>
  );
}
```

## Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>News Feed</title>
  <link rel="stylesheet" href="node_modules/@mieweb/news-widget/dist/news-widget.css">
</head>
<body>
  <div id="news-feed"></div>
  
  <script type="module">
    import { renderNewsWidget } from './node_modules/@mieweb/news-widget/dist/news-widget.js';
    renderNewsWidget(document.getElementById('news-feed'));
  </script>
</body>
</html>
```

## Embedding a Specific Feed (IIFE / iframe)

Use `feedId` to skip the landing page and render a specific feed directly:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="news-widget.css">
</head>
<body>
  <div id="root"></div>
  <script src="news-widget.iife.js"></script>
  <script>
    // Read feedId from URL params (e.g., ?feedId=features)
    var params = new URLSearchParams(window.location.search);
    var feedId = params.get('feedId');
    NewsWidget.renderNewsWidget(
      document.getElementById('root'),
      feedId ? { feedId: feedId } : {}
    );
  </script>
</body>
</html>
```

Embed as an iframe:

```html
<iframe src="widget.html?feedId=features" style="width:100%;height:600px;border:none;"></iframe>
```

## Registering a Custom Feed at Runtime

Use `registerFeed()` to add a feed dynamically before rendering:

```html
<script src="news-widget.iife.js"></script>
<script>
  NewsWidget.registerFeed({
    id: 'my-custom-feed',
    name: 'My Custom Feed',
    description: 'A custom RSS source',
    url: 'https://example.com/feed.rss',
    emoji: '📰',
    capabilities: { supportsLikes: true, supportsComments: true }
  });

  NewsWidget.renderNewsWidget(
    document.getElementById('root'),
    { feedId: 'my-custom-feed' }
  );
</script>
```

## Custom Styled Example

```tsx
import { NewsWidget } from '@mieweb/news-widget';
import '@mieweb/news-widget/dist/style.css';
import './custom-theme.css'; // Your custom overrides

export default function StyledNews() {
  return (
    <div className="custom-news-container">
      <NewsWidget />
    </div>
  );
}
```

```css
/* custom-theme.css */
:root {
  /* Override default colors */
  --news-widget-bg: #f0f0f0;
  --news-widget-primary: #ff6b35;
  --news-widget-text: #1a1a1a;
}

/* Add custom styles */
.custom-news-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
```

## Advanced: Custom Feed Implementation

```tsx
import { useFeed, FeedCard } from '@mieweb/news-widget';
import '@mieweb/news-widget/style.css';

export default function CustomFeed() {
  const { posts, loading, error, refresh } = useFeed(
    'https://example.com/feed.rss'
  );
  
  if (loading) return <div>Loading news...</div>;
  if (error) return <div>Error loading feed: {error}</div>;
  
  return (
    <div>
      <button onClick={refresh}>Refresh Feed</button>
      <div className="custom-feed-grid">
        {posts.map(post => (
          <FeedCard 
            key={post.id} 
            post={post}
            onLike={(id) => console.log('Liked:', id)}
            onComment={(id) => console.log('Comment on:', id)}
          />
        ))}
      </div>
    </div>
  );
}
```

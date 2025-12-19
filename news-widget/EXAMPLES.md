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

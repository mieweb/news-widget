# News Widget

An embeddable Instagram-style news feed widget with video playback, swipe gestures, and real-time comments.

## 📖 Documentation

The main documentation is located in the **[news-widget/](news-widget/)** directory.

**→ [View Full README](news-widget/README.md)**

## Quick Links

- 📦 [Installation & Embedding Guide](news-widget/README.md#-embedding-the-widget)
- 🎨 [Customizing Colors & Themes](news-widget/README.md#-customizing-colors--styles)
- 📚 [Usage Examples](news-widget/EXAMPLES.md)
- 🧪 [Development Setup](news-widget/README.md#-development)
- 📝 [Working backward charter](https://docs.google.com/document/d/1fFmoF4miD294x8icvJu7XiMFwB1GOunwSkJ7Uo1ShWM/edit?tab=t.0
)

## Repository Structure

```
news-widget/
├── news-widget/          # Main package source
│   ├── src/             # React components, hooks, and types
│   ├── tests/           # Playwright E2E tests
│   ├── README.md        # 📖 Main documentation
│   └── EXAMPLES.md      # Usage examples
├── .github/
│   └── workflows/       # GitHub Actions (automated NPM publish)
└── POC.md              # Proof of concept notes
```

## NPM Package

```bash
npm install @mieweb/news-widget
```

```tsx
import { NewsWidget } from '@mieweb/news-widget';
import '@mieweb/news-widget/style.css';

function App() {
  return <NewsWidget />;
}
```

For complete documentation, see **[news-widget/README.md](news-widget/README.md)**.

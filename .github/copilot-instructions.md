## Project: News Widget (Instagram-style Video Feed)

This is a React + TypeScript + Vite project that implements an embeddable Instagram-style news video feed component.

### Tech Stack
- **React 19** + **TypeScript** + **Vite 7**
- **react-player** (v3) for MP4/YouTube video playback
- **react-swipeable** for gesture handling
- **IntersectionObserver** for visibility-based autoplay

### Project Structure
```
news-widget/
├── src/
│   ├── components/     # React components (Feed, FeedCard, FullscreenViewer, CommentsPanel)
│   ├── hooks/          # Custom hooks (useFeed, useComments, useVisibility)
│   ├── types/          # TypeScript interfaces (Post, Comment, MediaType)
│   ├── App.tsx         # Main app entry
│   └── main.tsx        # React DOM render
├── public/             # Static assets
└── package.json
```

### Key Patterns

#### Components
- Each component has its own `.tsx` and `.css` file
- Components export from `components/index.ts` barrel file
- Use semantic class names prefixed with component name (e.g., `.feed-card`, `.fullscreen-viewer`)

#### Hooks
- `useFeed` - Fetches and parses RSS feed data
- `useComments` - Manages comment state per post
- `useVisibility` - IntersectionObserver wrapper for autoplay

#### Media Handling
- Use `react-player` with `src` prop (not `url` - v3 API change)
- Support YouTube URLs, MP4 URLs, and static images
- Videos autoplay muted, tap to unmute
- Only one video plays at a time (pause others when new one starts)

### RSS Feed Integration
- Data source: `https://community.enterprise.health/c/testing/11.rss`
- Parse with DOMParser, extract media from `<enclosure>` or `<media:content>`
- Extract YouTube URLs from post content with regex

### Sample Feed (src/data/sampleFeed.ts)
- Used for local testing and automated tests
- **YouTube URLs only** for external video content (test reliability)
- **No external image services** (picsum.photos, placeholder.com, etc.)
- Use `mediaType: 'none'` for text-only posts instead of external images
- This ensures automated tests don't fail due to flaky network requests

### Commands
```bash
cd news-widget
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## Code Quality Principles

<!-- https://github.com/mieweb/template-mieweb-opensource/blob/main/.github/copilot-instructions.md -->

### 🎯 DRY (Don't Repeat Yourself)
- **Never duplicate code**: If you find yourself copying code, extract it into a reusable function
- **Single source of truth**: Each piece of knowledge should have one authoritative representation
- **Refactor mercilessly**: When you see duplication, eliminate it immediately
- **Shared utilities**: Common patterns should be abstracted into utility functions

### 💋 KISS (Keep It Simple, Stupid)
- **Simple solutions**: Prefer the simplest solution that works
- **Avoid over-engineering**: Don't add complexity for hypothetical future needs
- **Clear naming**: Functions and variables should be self-documenting
- **Small functions**: Break down complex functions into smaller, focused ones
- **Readable code**: Code should be obvious to understand at first glance

### 🧹 Folder Philosophy
- **Clear purpose**: Every folder should have a main thing that anchors its contents.
- **No junk drawers**: Don’t leave loose files without context or explanation.
- **Explain relationships**: If it’s not elegantly obvious how files fit together, add a README or note.
- **Immediate clarity**: Opening a folder should make its organizing principle clear at a glance.

### 🔄 Refactoring Guidelines
- **Continuous improvement**: Refactor as you work, not as a separate task
- **Safe refactoring**: Always run tests before and after refactoring
- **Incremental changes**: Make small, safe changes rather than large rewrites
- **Preserve behavior**: Refactoring should not change external behavior
- **Code reviews**: All refactoring should be reviewed for correctness

### ⚰️ Dead Code Management
- **Immediate removal**: Delete unused code immediately when identified
- **Historical preservation**: Move significant dead code to `.attic/` directory with context
- **Documentation**: Include comments explaining why code was moved to attic
- **Regular cleanup**: Review and clean attic directory periodically
- **No accumulation**: Don't let dead code accumulate in active codebase

## HTML & CSS Guidelines
- **Semantic Naming**: Every `<div>` and other structural element must use a meaningful, semantic class name that clearly indicates its purpose or role within the layout.
- **CSS Simplicity**: Styles should avoid global resets or overrides that affect unrelated components or default browser behavior. Keep changes scoped and minimal.
- **SASS-First Approach**: All styles should be written in SASS (SCSS) whenever possible. Each component should have its own dedicated SASS file to promote modularity and maintainability.

## Accessibility (ARIA Labeling)

### 🎯 Interactive Elements
- **All interactive elements** (buttons, links, forms, dialogs) must include appropriate ARIA roles and labels
- **Use ARIA attributes**: Implement aria-label, aria-labelledby, and aria-describedby to provide clear, descriptive information for screen readers
- **Semantic HTML**: Use semantic HTML wherever possible to enhance accessibility

### 📢 Dynamic Content
- **Announce updates**: Ensure all dynamic content updates (modals, alerts, notifications) are announced to assistive technologies using aria-live regions
- **Maintain tab order**: Maintain logical tab order and keyboard navigation for all features
- **Visible focus**: Provide visible focus indicators for all interactive elements

## Internationalization (I18N)

### 🌍 Text and Language Support
- **Externalize text**: All user-facing text must be externalized for translation
- **Multiple languages**: Support multiple languages, including right-to-left (RTL) languages such as Arabic and Hebrew
- **Language selector**: Provide a language selector for users to choose their preferred language

### 🕐 Localization
- **Format localization**: Ensure date, time, number, and currency formats are localized based on user settings
- **UI compatibility**: Test UI layouts for text expansion and RTL compatibility
- **Unicode support**: Use Unicode throughout to support international character sets

## Documentation Preferences

### Diagrams and Visual Documentation
- **Always use Mermaid diagrams** instead of ASCII art for workflow diagrams, architecture diagrams, and flowcharts
- **Use memorable names** instead of single letters in diagrams (e.g., `Engine`, `Auth`, `Server` instead of `A`, `B`, `C`)
- Use appropriate Mermaid diagram types:
  - `graph TB` or `graph LR` for workflow architectures 
  - `flowchart TD` for process flows
  - `sequenceDiagram` for API interactions
  - `gitgraph` for branch/release strategies
- Include styling with `classDef` for better visual hierarchy
- Add descriptive comments and emojis sparingly for clarity

### Documentation Standards
- Keep documentation DRY (Don't Repeat Yourself) - reference other docs instead of duplicating
- Use clear cross-references between related documentation files
- Update the main architecture document when workflow structure changes

## Working with GitHub Actions Workflows

### Development Philosophy
- **Script-first approach**: All workflows should call scripts that can be run locally
- **Local development parity**: Developers should be able to run the exact same commands locally as CI runs
- **Simple workflows**: GitHub Actions should be thin wrappers around scripts, not contain complex logic
- **Easy debugging**: When CI fails, developers can reproduce the issue locally by running the same script

## Browser Testing with MCP

### 🌐 Keep Browser Open
- **Never close the browser** after running MCP browser commands unless explicitly asked
- Let the user interact with the browser after navigation or testing
- Only use `browser_close` when the user specifically requests it
- Take snapshots to report state, but leave the browser running for manual inspection

## E2E Testing with Playwright

### 🧪 Test Writing Best Practices (Accessibility-First)
- **Use ARIA roles and labels**: Never use class selectors (`.card-actions`, `.comment-item`). Always use accessibility-first selectors.
- **Semantic selectors over CSS**: Use `page.getByRole('button', { name: /pattern/ })` instead of `page.locator('.action-button')`
- **ARIA attributes in tests**: Target elements by their ARIA roles and labels:
  - `page.getByRole('button', { name: 'Post comment' })`
  - `page.getByRole('textbox', { name: 'Comment input field' })`
  - `page.locator('[role="listitem"]')` for list items
  - `page.locator('[role="region"]')` for regions
- **Extract data from aria-label**: Parse counts and state from aria-label attributes rather than textContent:
  ```typescript
  const ariaLabel = await button.getAttribute('aria-label');
  const match = ariaLabel?.match(/\((\d+) likes\)/);
  const count = match ? parseInt(match[1]) : 0;
  ```
- **Check aria-pressed and aria-expanded**: Use state attributes for toggled elements:
  ```typescript
  const isPressed = await button.getAttribute('aria-pressed');
  const isExpanded = await button.getAttribute('aria-expanded');
  ```

### 📝 Test Structure Examples
```typescript
// ✅ Good: Uses ARIA roles and labels
test('should add and sync comment', async ({ page }) => {
  const commentInput = page.getByRole('textbox', { name: 'Comment input field' });
  await commentInput.fill('Test comment');
  await page.getByRole('button', { name: 'Post comment' }).click();
  
  // Target by listitem role
  await expect(page.locator('[role="listitem"]').last()).toContainText('Test comment');
});

// ❌ Bad: Uses class selectors (fragile)
test('should add and sync comment', async ({ page }) => {
  const commentInput = page.locator('.comment-input');
  await commentInput.fill('Test comment');
  await page.locator('.comment-submit').click();
  
  // Breaks if CSS class changes
  await expect(page.locator('.comment-item').last()).toContainText('Test comment');
});
```

### 🎯 Benefits of Accessibility-First Testing
- **Tests survive CSS refactors**: Changes to `.card-actions` or class names don't break tests
- **Screen reader validation**: Tests verify accessibility compliance automatically
- **Better maintainability**: Intent is clear from role/label, not fragile CSS classes
- **508 compliance**: Tests ensure accessibility standards are met
- **User-focused**: Tests validate what users actually interact with (labels, roles)

### 📋 Test Checklist
- [ ] **No class selectors**: All selectors use roles, labels, or ARIA attributes
- [ ] **Semantic roles**: Every interactive element has appropriate `role=` attribute
- [ ] **Clear labels**: All buttons/inputs have meaningful `aria-label` attributes
- [ ] **ARIA state**: Use `aria-pressed`, `aria-expanded`, `aria-live` where appropriate
- [ ] **Accessibility verified**: Tests would work with screen readers
- [ ] **No hardcoded text dependencies**: Use roles/labels, not textContent matching when possible

## Quick Reference

### 🪶 All Changes should be considered for Pull Request Philosophy

* **Smallest viable change**: Always make the smallest change that fully solves the problem.
* **Fewest files first**: Start with the minimal number of files required.
* **No sweeping edits**: Broad refactors or multi-module changes must be split or proposed as new components.
* **Isolated improvements**: If a change grows complex, extract it into a new function, module, or component instead of modifying multiple areas.
* **Direct requests only**: Large refactors or architectural shifts should only occur when explicitly requested.

### Code Quality Checklist
- [ ] **DRY**: No code duplication - extracted reusable functions?
- [ ] **KISS**: Simplest solution that works?
- [ ] **Minimal Changes**: Smallest viable change made for PR?
- [ ] **Naming**: Self-documenting function/variable names?
- [ ] **Size**: Functions small and focused?
- [ ] **Dead Code**: Removed or archived appropriately?
- [ ] **Accessibility**: ARIA labels and semantic HTML implemented?
- [ ] **I18N**: User-facing text externalized for translation?
- [ ] **Lint**: Run linter if appropriate
- [ ] **Test**: Run tests
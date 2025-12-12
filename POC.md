
Development ticket: Instagram-style News Video Feed (PoC)

Summary
- Build an embeddable React component that renders a vertical feed of “cards” supporting images, MP4 videos, and YouTube videos.
- Users can scroll or enter a full-screen “viewer” mode that pages one card at a time with flick/keyboard navigation.
- Each card supports like, comment, and share.
- Autoplay/pause behavior for videos: play when the card is prominent, pause when not visible.
- The feed should be from https://community.enterprise.health/c/testing/11.rss as an example data source.

Goals
- Single drop-in React component (Feed) with minimal props and no external CSS frameworks required.
- Support direct MP4 URLs, YouTube URLs, and static images.
- Smooth, seamless playback experience with lazy loading and virtualization for performance.
- Mobile-first interactions: swipe to advance, double-tap to like, Web Share API where available.

Out of scope (for PoC)
- Auth, moderation, admin tools, push notifications, advanced analytics, live streaming.

Target tech stack
- React 18 + TypeScript + Vite.
- react-player for MP4/YouTube handling: https://github.com/cookpete/react-player?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai
- react-window for virtualization: https://react-window.now.sh/?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai
- react-swipeable for gestures: https://www.npmjs.com/package/react-swipeable?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai
- IntersectionObserver for visibility-based autoplay: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai
- Optional: Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai

Core user stories
- As a user, I can scroll a feed of cards containing images, MP4s, and YouTube videos.
- As a user, I can enter a full-screen viewer to flick through cards and watch videos.
- As a user, video cards auto-play when in view and pause when out of view.
- As a user, I can like, comment, and share a post.
- As a user, I see loading states and graceful fallbacks on failure.

Acceptance criteria
- Feed renders provided posts array with mixed media and shows author, caption, timestamps, and counts from https://community.enterprise.health/c/testing/11.rss
- MP4 and YouTube both play in-feed with correct controls, muted autoplay where possible, tap to unmute.
- Videos pause when scrolled off-screen; only one video plays at a time.
- Full-screen viewer supports swipe left/right (or up/down) to change cards; keyboard navigation works on desktop.
- Likes update optimistically; comments panel opens inline (drawer or modal) with create/read comments.
- Share triggers Web Share API if available, falling back to copy link.
- Virtualization/lazy loading: only a small number of cards in DOM at once.
- Accessible: keyboard navigable controls, labels for buttons, color contrast, focus management in


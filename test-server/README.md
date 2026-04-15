# Test Discourse Server

A lightweight Express server that mimics Discourse's RSS and API endpoints for local testing of the news widget.

## Quick Start

From the `news-widget` directory:
```bash
npm run test-server
```

Or start both dev server and test server together:
```bash
npm run dev:full
```

Or from the test-server directory:
```bash
cd test-server
npm install
npm start
```

The server runs on `http://localhost:3001`

## Endpoints

### RSS Feed
```
GET /c/:category/:id.rss
```
Returns an RSS feed with sample posts including YouTube videos and text-only posts.

### Topic JSON (Comments)
```
GET /t/:id.json
```
Returns topic data with comments in Discourse format.

**Sample topic IDs:** 1001, 1002, 1003, 1004

### Auth Status
```
GET /session/current.json
```
Returns current user if authenticated, 404 if not.

### Create Comment
```
POST /posts.json
Content-Type: application/json

{ "topic_id": 1001, "raw": "My comment text" }
```
Creates a new comment (requires authentication).

## Test Endpoints

These endpoints help control server state during testing:

### Login
```bash
curl -X POST http://localhost:3001/test/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "name": "Test User"}'
```

### Logout
```bash
curl -X POST http://localhost:3001/test/logout
```

### Status
```bash
curl http://localhost:3001/test/status
```

### Reset (Clear all comments, logout)
```bash
curl -X POST http://localhost:3001/test/reset
```

## Integration with News Widget

Add to `feedRegistry.ts`:
```typescript
{
  id: 'test-server',
  name: 'Test Server',
  description: 'Local test Discourse server',
  icon: '🧪',
  url: 'http://localhost:3001/c/testing/1.rss',
  capabilities: { likes: true, comments: true, share: true },
}
```

Add proxy to `vite.config.ts`:
```typescript
'/api/test': {
  target: 'http://localhost:3001',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/test/, ''),
}
```

## Data Persistence

Comments are persisted to `comments.json` in the test-server directory. Delete this file to reset to initial sample comments.

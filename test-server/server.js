/**
 * Test RSS Feed and Comment Server
 * 
 * Mimics Discourse API for local testing:
 * - GET /c/:category/:id.rss - RSS feed
 * - GET /t/:id.json - Topic with comments
 * - GET /session/current.json - Auth status
 * - POST /posts.json - Create comment
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-memory state
let isAuthenticated = false;
let currentUser = null;

// Persistence file for comments
const COMMENTS_FILE = join(__dirname, 'comments.json');

/**
 * Load comments from disk
 */
function loadComments() {
  if (existsSync(COMMENTS_FILE)) {
    try {
      return JSON.parse(readFileSync(COMMENTS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Save comments to disk
 */
function saveComments(comments) {
  writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

// Comments storage: { topicId: [{ id, username, name, cooked, created_at }] }
let comments = loadComments();

/**
 * Sample posts for the RSS feed
 */
const SAMPLE_POSTS = [
  {
    id: 1001,
    title: 'Welcome to the Test Community',
    author: 'admin',
    description: 'This is a welcome post for testing the news widget.',
    pubDate: new Date(Date.now() - 1000 * 60 * 60).toUTCString(), // 1 hour ago
    link: '/api/test/t/welcome-to-test/1001',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    mediaType: 'video/youtube',
    likes: 42,
    replies: 5,
  },
  {
    id: 1002,
    title: 'Testing Video Embeds',
    author: 'tester',
    description: 'Let\'s test how YouTube videos are embedded in the feed.',
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toUTCString(), // 2 hours ago
    link: '/api/test/t/testing-video-embeds/1002',
    mediaUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    mediaType: 'video/youtube',
    likes: 128,
    replies: 12,
  },
  {
    id: 1003,
    title: 'Text Only Post Example',
    author: 'writer',
    description: 'This post has no media attached. It demonstrates how text-only posts are displayed in the news feed widget with a nice gradient background.',
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toUTCString(), // 3 hours ago
    link: '/api/test/t/text-only-example/1003',
    mediaUrl: null,
    mediaType: null,
    likes: 89,
    replies: 7,
  },
  {
    id: 1004,
    title: 'React 19 Features Discussion',
    author: 'developer',
    description: 'Discussing the new features in React 19 and how they improve developer experience.',
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toUTCString(), // 5 hours ago
    link: '/api/test/t/react-19-features/1004',
    mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
    mediaType: 'video/youtube',
    likes: 256,
    replies: 34,
  },
];

/**
 * Sample comments for topics
 */
const INITIAL_COMMENTS = {
  1001: [
    { id: 10011, username: 'user1', name: 'Alice Smith', cooked: '<p>Great introduction! Looking forward to more content.</p>', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 10012, username: 'user2', name: 'Bob Jones', cooked: '<p>Thanks for setting this up!</p>', created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
  ],
  1002: [
    { id: 10021, username: 'videofan', name: 'Video Fan', cooked: '<p>Love the Big Buck Bunny reference!</p>', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  ],
  1003: [
    { id: 10031, username: 'reader', name: 'Content Reader', cooked: '<p>Nice clean design for text posts.</p>', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  ],
  1004: [
    { id: 10041, username: 'reactdev', name: 'React Developer', cooked: '<p>The new hooks are amazing!</p>', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
    { id: 10042, username: 'learner', name: 'JS Learner', cooked: '<p>Can someone explain use() hook?</p>', created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString() },
    { id: 10043, username: 'reactdev', name: 'React Developer', cooked: '<p>@learner The use() hook lets you read resources like promises!</p>', created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString() },
  ],
};

// Initialize comments with initial data if empty
if (Object.keys(comments).length === 0) {
  comments = { ...INITIAL_COMMENTS };
  saveComments(comments);
}

/**
 * Generate RSS XML feed
 */
function generateRssFeed(posts) {
  const items = posts.map(post => {
    let mediaTag = '';
    if (post.mediaUrl) {
      mediaTag = `<enclosure url="${post.mediaUrl}" type="${post.mediaType}" />`;
    }
    
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${post.link}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${post.pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author}]]></dc:creator>
      <discourse:like_count>${post.likes}</discourse:like_count>
      <discourse:reply_count>${post.replies}</discourse:reply_count>
      ${mediaTag}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:discourse="http://discourse.org/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Test Feed</title>
    <link>http://localhost:${PORT}</link>
    <description>Test RSS feed for news widget development</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`;
}

// ============ ROUTES ============

/**
 * RSS Feed endpoint
 * GET /c/:category/:id.rss
 */
app.get('/c/:category/:id.rss', (req, res) => {
  console.log(`[RSS] Serving feed for category: ${req.params.category}`);
  res.type('application/rss+xml');
  res.send(generateRssFeed(SAMPLE_POSTS));
});

/**
 * Topic RSS endpoint (display single topic as RSS)
 * GET /t/:slug/:id.rss
 */
app.get('/t/:slug/:id.rss', (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  const post = SAMPLE_POSTS.find(p => p.id === topicId);
  
  if (!post) {
    return res.status(404).send('Topic not found');
  }
  
  console.log(`[RSS] Serving single topic RSS: ${topicId}`);
  res.type('application/rss+xml');
  res.send(generateRssFeed([post]));
});

/**
 * Topic HTML endpoint (display single topic as HTML)
 * GET /t/:slug/:id
 */
app.get('/t/:slug/:id', (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  const post = SAMPLE_POSTS.find(p => p.id === topicId);
  
  if (!post) {
    return res.status(404).send('Topic not found');
  }
  
  console.log(`[HTML] Serving topic: ${topicId}`);
  res.type('text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${post.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; }
    .meta { color: #666; margin: 20px 0; }
    .content { line-height: 1.6; }
    .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .media { margin: 20px 0; }
    a { color: #0066cc; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${post.title}</h1>
  <div class="meta">
    By <strong>${post.author}</strong> • ${new Date(post.pubDate).toLocaleString()}
  </div>
  <div class="stats">
    ❤️ ${post.likes} likes • 💬 ${post.replies} replies
  </div>
  <div class="content">
    <p>${post.description}</p>
  </div>
  ${post.mediaUrl ? `<div class="media">
    <p><strong>Media:</strong> <a href="${post.mediaUrl}" target="_blank">${post.mediaUrl}</a></p>
  </div>` : ''}
  <hr>
  <h2>RSS Feed (Raw)</h2>
  <pre>${generateRssFeed([post]).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  <p><a href="/t/${req.params.slug}/${req.params.id}.rss">View as RSS XML</a></p>
</body>
</html>`);
});

/**
 * Topic JSON endpoint (for fetching comments)
 * GET /t/:id.json
 */
app.get('/t/:id.json', (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  const post = SAMPLE_POSTS.find(p => p.id === topicId);
  
  if (!post) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  const topicComments = comments[topicId] || [];
  const replyCount = topicComments.length;
  
  // Build posts array (first post is the topic itself, rest are replies)
  const posts = [
    {
      id: topicId,
      post_number: 1,
      username: post.author,
      name: post.author.charAt(0).toUpperCase() + post.author.slice(1),
      avatar_template: `/letter_avatar/${post.author}/{size}/1.png`,
      cooked: `<p>${post.description}</p>`,
      created_at: new Date(post.pubDate).toISOString(),
    },
    ...topicComments.map((comment, index) => ({
      id: comment.id,
      post_number: index + 2,
      username: comment.username,
      name: comment.name,
      avatar_template: `/letter_avatar/${comment.username}/{size}/1.png`,
      cooked: comment.cooked,
      created_at: comment.created_at,
    })),
  ];

  console.log(`[Topic] Serving topic ${topicId} with ${replyCount} comments`);
  
  res.json({
    id: topicId,
    title: post.title,
    like_count: post.likes,
    reply_count: replyCount,
    post_stream: {
      posts,
    },
  });
});

/**
 * Session endpoint (auth status)
 * GET /session/current.json
 */
app.get('/session/current.json', (req, res) => {
  if (isAuthenticated && currentUser) {
    console.log(`[Auth] User authenticated: ${currentUser.username}`);
    res.json({
      current_user: currentUser,
    });
  } else {
    console.log('[Auth] No user authenticated');
    res.status(404).json({ error: 'Not logged in' });
  }
});

/**
 * Create post/comment endpoint
 * POST /posts.json
 */
app.post('/posts.json', (req, res) => {
  if (!isAuthenticated || !currentUser) {
    return res.status(403).json({ error: 'Not authenticated' });
  }

  const { topic_id, raw } = req.body;
  
  if (!topic_id || !raw) {
    return res.status(400).json({ error: 'Missing topic_id or raw content' });
  }

  const topicId = parseInt(topic_id, 10);
  
  if (!comments[topicId]) {
    comments[topicId] = [];
  }

  const newComment = {
    id: Date.now(),
    username: currentUser.username,
    name: currentUser.name,
    cooked: `<p>${raw}</p>`,
    created_at: new Date().toISOString(),
  };

  comments[topicId].push(newComment);
  saveComments(comments);

  console.log(`[Comment] Added comment to topic ${topicId} by ${currentUser.username}`);

  res.json({
    id: newComment.id,
    topic_id: topicId,
    post_number: comments[topicId].length + 1,
    username: newComment.username,
    name: newComment.name,
    cooked: newComment.cooked,
    created_at: newComment.created_at,
  });
});

/**
 * Login endpoint (for testing)
 * POST /test/login
 */
app.post('/test/login', (req, res) => {
  const { username, name } = req.body;
  
  currentUser = {
    id: Date.now(),
    username: username || 'testuser',
    name: name || 'Test User',
    avatar_template: `/letter_avatar/${username || 'testuser'}/{size}/1.png`,
  };
  isAuthenticated = true;
  
  console.log(`[Auth] User logged in: ${currentUser.username}`);
  res.json({ success: true, user: currentUser });
});

/**
 * Logout endpoint (for testing)
 * POST /test/logout
 */
app.post('/test/logout', (req, res) => {
  console.log(`[Auth] User logged out: ${currentUser?.username}`);
  currentUser = null;
  isAuthenticated = false;
  res.json({ success: true });
});

/**
 * Status endpoint
 * GET /test/status
 */
app.get('/test/status', (req, res) => {
  res.json({
    authenticated: isAuthenticated,
    user: currentUser,
    commentCounts: Object.fromEntries(
      Object.entries(comments).map(([id, list]) => [id, list.length])
    ),
  });
});

/**
 * Reset endpoint (clear all comments)
 * POST /test/reset
 */
app.post('/test/reset', (req, res) => {
  comments = JSON.parse(JSON.stringify(INITIAL_COMMENTS));
  saveComments(comments);
  isAuthenticated = false;
  currentUser = null;
  console.log('[Test] Server state reset');
  res.json({ success: true });
});

/**
 * Letter avatar endpoint (simple colored avatar)
 */
app.get('/letter_avatar/:username/:size/:version.png', (req, res) => {
  // Return a simple redirect to a placeholder or generate SVG
  const { username, size } = req.params;
  const letter = username.charAt(0).toUpperCase();
  
  // Generate simple SVG avatar
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];
  const colorIndex = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.5}" font-weight="bold">${letter}</text>
  </svg>`;
  
  res.type('image/svg+xml');
  res.send(svg);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🧪 Test Discourse Server running on http://localhost:${PORT}

Available endpoints:
  RSS Feed:     GET  /c/:category/:id.rss
  Topic JSON:   GET  /t/:id.json
  Auth Status:  GET  /session/current.json
  Post Comment: POST /posts.json

Test endpoints:
  Login:        POST /test/login   { username, name }
  Logout:       POST /test/logout
  Status:       GET  /test/status
  Reset:        POST /test/reset

Sample topic IDs: 1001, 1002, 1003, 1004
  `);
});

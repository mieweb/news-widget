/**
 * Vite plugin that embeds the test Discourse server as middleware
 * 
 * This allows running everything on a single port (5173)
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMENTS_FILE = join(__dirname, 'comments.json');

// In-memory state
let isAuthenticated = false;
let currentUser: { id: number; username: string; name: string; avatar_template: string } | null = null;

/**
 * Sample posts for the RSS feed
 */
const SAMPLE_POSTS = [
  {
    id: 1001,
    title: 'Welcome to the Test Community',
    author: 'admin',
    description: 'This is a welcome post for testing the news widget.',
    pubDate: new Date(Date.now() - 1000 * 60 * 60).toUTCString(),
    link: 'http://localhost:5173/t/welcome-to-test/1001',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    mediaType: 'video/youtube',
    likes: 42,
    replies: 5,
  },
  {
    id: 1002,
    title: 'Testing Video Embeds',
    author: 'tester',
    description: "Let's test how YouTube videos are embedded in the feed.",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toUTCString(),
    link: 'http://localhost:5173/t/testing-video-embeds/1002',
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
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toUTCString(),
    link: 'http://localhost:5173/t/text-only-example/1003',
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
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toUTCString(),
    link: 'http://localhost:5173/t/react-19-features/1004',
    mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
    mediaType: 'video/youtube',
    likes: 256,
    replies: 34,
  },
];

/**
 * Initial comments for topics
 */
const INITIAL_COMMENTS: Record<number, Array<{ id: number; username: string; name: string; cooked: string; created_at: string }>> = {
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

// Comments storage
function loadComments(): Record<number, Array<{ id: number; username: string; name: string; cooked: string; created_at: string }>> {
  if (existsSync(COMMENTS_FILE)) {
    try {
      return JSON.parse(readFileSync(COMMENTS_FILE, 'utf-8'));
    } catch {
      return { ...INITIAL_COMMENTS };
    }
  }
  return { ...INITIAL_COMMENTS };
}

function saveComments(comments: Record<number, Array<{ id: number; username: string; name: string; cooked: string; created_at: string }>>): void {
  writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

let comments = loadComments();

// In-memory likes storage: { topicId: likeCount }
// Resets to initial values on server restart
const likes: Record<number, number> = {
  1001: 42,
  1002: 128,
  1003: 89,
  1004: 256,
};

/**
 * Generate RSS XML feed
 */
function generateRssFeed(): string {
  const items = SAMPLE_POSTS.map(post => {
    let mediaTag = '';
    if (post.mediaUrl) {
      mediaTag = `<enclosure url="${post.mediaUrl}" type="${post.mediaType}" />`;
    }
    
    // Use current like count from memory, fallback to initial value
    const currentLikes = likes[post.id] ?? post.likes;
    
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${post.link}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${post.pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author}]]></dc:creator>
      <discourse:like_count>${currentLikes}</discourse:like_count>
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
    <link>http://localhost:5173</link>
    <description>Test RSS feed for news widget development</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`;
}

/**
 * Generate SVG avatar
 */
function generateAvatar(username: string, size: number): string {
  const letter = username.charAt(0).toUpperCase();
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];
  const colorIndex = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.5}" font-weight="bold">${letter}</text>
  </svg>`;
}

/**
 * Parse JSON body from request
 */
async function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Vite plugin for test Discourse server
 */
export function testDiscourseServer(): Plugin {
  return {
    name: 'test-discourse-server',
    configureServer(server: ViteDevServer) {
      // Add middleware before Vite's default middleware
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        // RSS Feed: GET /api/test/c/:category/:id.rss
        const rssMatch = url.match(/^\/api\/test\/c\/[^/]+\/\d+\.rss/);
        if (rssMatch && method === 'GET') {
          console.log('[Test Server] RSS feed requested');
          res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
          res.end(generateRssFeed());
          return;
        }

        // Topic JSON: GET /api/test/t/:id.json
        const topicMatch = url.match(/^\/api\/test\/t\/(\d+)\.json/);
        if (topicMatch && method === 'GET') {
          const topicId = parseInt(topicMatch[1], 10);
          const post = SAMPLE_POSTS.find(p => p.id === topicId);
          
          if (!post) {
            sendJson(res, { error: 'Topic not found' }, 404);
            return;
          }

          const topicComments = comments[topicId] || [];
          const posts = [
            {
              id: topicId,
              post_number: 1,
              username: post.author,
              name: post.author.charAt(0).toUpperCase() + post.author.slice(1),
              avatar_template: `/api/test/letter_avatar/${post.author}/{size}/1.png`,
              cooked: `<p>${post.description}</p>`,
              created_at: new Date(post.pubDate).toISOString(),
            },
            ...topicComments.map((comment, index) => ({
              id: comment.id,
              post_number: index + 2,
              username: comment.username,
              name: comment.name,
              avatar_template: `/api/test/letter_avatar/${comment.username}/{size}/1.png`,
              cooked: comment.cooked,
              created_at: comment.created_at,
            })),
          ];

          console.log(`[Test Server] Topic ${topicId} with ${topicComments.length} comments`);
          sendJson(res, {
            id: topicId,
            title: post.title,
            like_count: likes[topicId] ?? post.likes,
            reply_count: topicComments.length,
            post_stream: { posts },
          });
          return;
        }

        // Session: GET /api/test/session/current.json
        if (url === '/api/test/session/current.json' && method === 'GET') {
          if (isAuthenticated && currentUser) {
            console.log(`[Test Server] Auth check: ${currentUser.username}`);
            sendJson(res, { current_user: currentUser });
          } else {
            console.log('[Test Server] Auth check: not logged in');
            sendJson(res, { error: 'Not logged in' }, 404);
          }
          return;
        }

        // Toggle like: POST /api/test/posts/:id/like
        const likeMatch = url.match(/^\/api\/test\/posts\/(\d+)\/like/);
        if (likeMatch && method === 'POST') {
          const postId = parseInt(likeMatch[1], 10);
          const post = SAMPLE_POSTS.find(p => p.id === postId);
          
          if (!post) {
            sendJson(res, { error: 'Post not found' }, 404);
            return;
          }

          // Toggle like (increment or decrement)
          parseBody(req).then(body => {
            const action = String(body.action || 'toggle');
            
            if (action === 'like') {
              likes[postId] = (likes[postId] ?? post.likes) + 1;
            } else if (action === 'unlike') {
              likes[postId] = Math.max(0, (likes[postId] ?? post.likes) - 1);
            } else {
              // Toggle based on current state - not ideal but works for now
              likes[postId] = (likes[postId] ?? post.likes) + 1;
            }

            console.log(`[Test Server] Like toggled on post ${postId}, new count: ${likes[postId]}`);
            sendJson(res, {
              success: true,
              post_id: postId,
              like_count: likes[postId],
            });
          });
          return;
        }

        // Post comment: POST /api/test/posts.json
        if (url === '/api/test/posts.json' && method === 'POST') {
          parseBody(req).then(body => {
            if (!isAuthenticated || !currentUser) {
              sendJson(res, { error: 'Not authenticated' }, 403);
              return;
            }

            const topicId = parseInt(String(body.topic_id), 10);
            const raw = String(body.raw || '');

            if (!topicId || !raw) {
              sendJson(res, { error: 'Missing topic_id or raw content' }, 400);
              return;
            }

            if (!comments[topicId]) {
              comments[topicId] = [];
            }

            const newComment = {
              id: Date.now(),
              username: currentUser!.username,
              name: currentUser!.name,
              cooked: `<p>${raw}</p>`,
              created_at: new Date().toISOString(),
            };

            comments[topicId].push(newComment);
            saveComments(comments);

            console.log(`[Test Server] Comment added to topic ${topicId}`);
            sendJson(res, {
              id: newComment.id,
              topic_id: topicId,
              post_number: comments[topicId].length + 1,
              ...newComment,
            });
          });
          return;
        }

        // Test login: POST /api/test/test/login
        if (url === '/api/test/test/login' && method === 'POST') {
          parseBody(req).then(body => {
            const username = String(body.username || 'testuser');
            const name = String(body.name || 'Test User');
            
            currentUser = {
              id: Date.now(),
              username,
              name,
              avatar_template: `/api/test/letter_avatar/${username}/{size}/1.png`,
            };
            isAuthenticated = true;
            
            console.log(`[Test Server] Login: ${username}`);
            sendJson(res, { success: true, user: currentUser });
          });
          return;
        }

        // Test logout: POST /api/test/test/logout
        if (url === '/api/test/test/logout' && method === 'POST') {
          console.log(`[Test Server] Logout: ${currentUser?.username}`);
          currentUser = null;
          isAuthenticated = false;
          sendJson(res, { success: true });
          return;
        }

        // Test status: GET /api/test/test/status
        if (url === '/api/test/test/status' && method === 'GET') {
          sendJson(res, {
            authenticated: isAuthenticated,
            user: currentUser,
            commentCounts: Object.fromEntries(
              Object.entries(comments).map(([id, list]) => [id, list.length])
            ),
          });
          return;
        }

        // Test reset: POST /api/test/test/reset
        if (url === '/api/test/test/reset' && method === 'POST') {
          comments = { ...INITIAL_COMMENTS };
          saveComments(comments);
          isAuthenticated = false;
          currentUser = null;
          console.log('[Test Server] Reset');
          sendJson(res, { success: true });
          return;
        }

        // Letter avatar: GET /api/test/letter_avatar/:username/:size/:version.png
        const avatarMatch = url.match(/^\/api\/test\/letter_avatar\/([^/]+)\/(\d+)\/\d+\.png/);
        if (avatarMatch && method === 'GET') {
          const username = avatarMatch[1];
          const size = parseInt(avatarMatch[2], 10);
          res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
          res.end(generateAvatar(username, size));
          return;
        }

        // Topic HTML view: GET /api/test/t/:slug/:id
        const topicHtmlMatch = url.match(/^\/api\/test\/t\/([^/]+)\/(\d+)$/);
        if (topicHtmlMatch && method === 'GET') {
          const slug = topicHtmlMatch[1];
          const topicId = parseInt(topicHtmlMatch[2], 10);
          const post = SAMPLE_POSTS.find(p => p.id === topicId);
          
          if (!post) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Topic Not Found</h1>');
            return;
          }

          console.log(`[Test Server] Serving topic HTML: ${topicId}`);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${post.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-top: 0; }
    .meta { color: #666; margin: 20px 0; font-size: 14px; }
    .content { line-height: 1.6; }
    .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .media { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px; }
    .media a { color: #0066cc; word-break: break-all; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; }
    .actions { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
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
    <div class="actions">
      <h2>Raw RSS Feed</h2>
      <pre>${generateRssFeed().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      <p>
        <a href="/api/test/c/testing/1.rss">View full RSS feed</a> •
        <a href="/api/test/t/${topicId}.json">View as JSON</a>
      </p>
    </div>
  </div>
</body>
</html>`);
          return;
        }

        // Not a test server route, continue to next middleware
        next();
      });

      console.log('\n🧪 Test Discourse Server enabled at /api/test/*');
      console.log('   Feed URL: http://localhost:5173/api/test/c/testing/1.rss\n');
    },
  };
}

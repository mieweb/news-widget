import { useState, useCallback } from 'react';
import type { Comment } from '../types';

// Mock comments storage (in a real app, this would be an API)
const mockCommentsDb: Map<string, Comment[]> = new Map();

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>(() => {
    return mockCommentsDb.get(postId) || [];
  });
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Get or generate mock comments
    let postComments = mockCommentsDb.get(postId);
    if (!postComments) {
      postComments = generateMockComments(postId);
      mockCommentsDb.set(postId, postComments);
    }
    
    setComments(postComments);
    setLoading(false);
  }, [postId]);

  const addComment = useCallback(
    async (content: string) => {
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        postId,
        author: {
          name: 'You',
          avatar: 'https://ui-avatars.com/api/?name=You&background=6366f1&color=fff',
        },
        content,
        timestamp: new Date(),
      };

      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      mockCommentsDb.set(postId, updatedComments);
      
      return newComment;
    },
    [postId, comments]
  );

  return { comments, loading, fetchComments, addComment };
}

function generateMockComments(postId: string): Comment[] {
  const sampleComments = [
    'Great post! 🔥',
    'Love this content!',
    'Thanks for sharing!',
    'This is amazing!',
    'Very informative 👍',
  ];

  const count = Math.floor(Math.random() * 3);
  const comments: Comment[] = [];

  for (let i = 0; i < count; i++) {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const name = names[Math.floor(Math.random() * names.length)];
    
    comments.push({
      id: `${postId}-comment-${i}`,
      postId,
      author: {
        name,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      },
      content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000),
    });
  }

  return comments;
}

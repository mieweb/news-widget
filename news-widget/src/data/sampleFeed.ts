import type { Post } from '../types';

export const SAMPLE_FEED_URL = 'demo://sample-feed';

export function getSamplePosts(): Post[] {
  return [
    {
      id: 'demo-1',
      author: {
        name: 'React Team',
      },
      caption: 'Introducing React 19 - New features and improvements for building modern web apps!',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE',
      thumbnailUrl: 'https://img.youtube.com/vi/T8TZQ6k4SLE/hqdefault.jpg',
      link: 'https://react.dev/blog/2024/12/05/react-19',
      timestamp: new Date(),
      likes: 42,
      commentCount: 5,
      isLiked: false,
    },
    {
      id: 'demo-2',
      author: {
        name: 'Tech News',
      },
      caption: 'Beautiful sunset captured on camera 🌅',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=1',
      timestamp: new Date(Date.now() - 3600000),
      likes: 128,
      commentCount: 12,
      isLiked: true,
    },
    {
      id: 'demo-3',
      author: {
        name: 'Video Creator',
      },
      caption: 'Sample MP4 video demonstration - Big Buck Bunny',
      mediaType: 'video',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      timestamp: new Date(Date.now() - 7200000),
      likes: 89,
      commentCount: 8,
      isLiked: false,
    },
    {
      id: 'demo-4',
      author: {
        name: 'Nature Photos',
      },
      caption: 'Mountain landscape photography 🏔️',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=2',
      timestamp: new Date(Date.now() - 10800000),
      likes: 256,
      commentCount: 24,
      isLiked: false,
    },
    {
      id: 'demo-5',
      author: {
        name: 'Code Tips',
      },
      caption: 'TypeScript tips and tricks for better code quality ✨',
      mediaType: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=3',
      link: 'https://www.typescriptlang.org/docs/',
      timestamp: new Date(Date.now() - 14400000),
      likes: 312,
      commentCount: 45,
      isLiked: false,
    },
  ];
}

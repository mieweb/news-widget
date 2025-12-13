export type MediaType = 'image' | 'video' | 'youtube' | 'none';

export interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  caption: string;
  mediaType: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  link?: string;
  timestamp: Date;
  likes: number;
  commentCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
}

export interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

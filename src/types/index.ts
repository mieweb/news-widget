export type MediaType = 'image' | 'video' | 'youtube' | 'none';

/**
 * Describes what engagement features a feed supports.
 * Used to conditionally render like/comment UI elements.
 */
export interface FeedCapabilities {
  /** Whether the feed supports liking posts */
  supportsLikes: boolean;
  /** Whether the feed supports comments */
  supportsComments: boolean;
}

export interface Post {
  id: string;
  /** Topic ID for Discourse feeds - used to fetch engagement data */
  topicId?: number;
  /** Post title from RSS <title> element */
  title?: string;
  author: {
    name: string;
    avatar?: string;
    /** User title/role (e.g., "Training Manager") */
    title?: string;
  };
  caption: string;
  mediaType: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  link?: string;
  timestamp: Date;
  /** Like count - undefined means not yet loaded */
  likes?: number;
  /** Comment/reply count - undefined means not yet loaded */
  commentCount?: number;
  isLiked: boolean;
}

/** Status of a comment in relation to the server */
export type CommentStatus = 'synced' | 'pending' | 'failed';

export interface Comment {
  id: string;
  postId: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  /** Sync status - 'synced' for server comments, 'pending'/'failed' for local */
  status?: CommentStatus;
}

/**
 * Discourse user info from session
 */
export interface DiscourseUser {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
}

export interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

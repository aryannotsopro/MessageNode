export interface User {
  _id: string;
  name: string;
  email: string;
  status?: string;
  profilePicture?: string;
  coverPicture?: string;
  location?: string;
  website?: string;
  posts?: string[];
  followers?: string[] | User[];
  following?: string[] | User[];
  bookmarks?: string[];
  createdAt?: string;
}

export interface Comment {
  _id: string
  text: string
  author: User
  post?: string
  createdAt: string
}

export interface Post {
  _id: string
  title: string
  content: string
  imageUrl: string
  creator: User
  likes: string[]
  comments: Comment[]
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  token: string
  userId: string
  message?: string
}

export interface ApiError {
  message: string
  errors?: { msg: string; param: string }[]
}

export interface PaginatedResponse<T> {
  posts: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalPosts: number
    hasMore: boolean
  }
}

export interface Story {
  _id: string;
  creator: User;
  imageUrl: string;
  caption?: string;
  viewers: string[];
  expiresAt: string;
  createdAt: string;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
}

export type ToastType = 'info' | 'success' | 'error' | 'warning'

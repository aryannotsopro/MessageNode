export interface User {
  _id: string
  name: string
  email: string
  status?: string
  posts?: Post[]
  createdAt?: string
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
  totalPosts: number
  currentPage: number
  totalPages: number
}

export type ToastType = 'info' | 'success' | 'error' | 'warning'

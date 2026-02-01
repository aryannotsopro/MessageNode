import axios, { AxiosError } from 'axios'
import type { User, Post, AuthResponse, ApiError, PaginatedResponse } from '@/types'

const API_URL = 'https://messagenode-c5q9.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  signup: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/signup', { name, email, password }),
  
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  getMe: () => api.get<{ user: User }>('/me'),
}

// Posts API
export const postsApi = {
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Post>>('/posts', { params: { page, limit } }),
  
  getById: (id: string) =>
    api.get<{ post: Post }>(`/posts/${id}`),
  
  create: (title: string, content: string, imageUrl: string) =>
    api.post<{ message: string; post: Post }>('/posts', { title, content, imageUrl }),
  
  update: (id: string, title: string, content: string, imageUrl: string) =>
    api.put<{ message: string; post: Post }>(`/posts/${id}`, { title, content, imageUrl }),
  
  delete: (id: string) =>
    api.delete<{ message: string }>(`/posts/${id}`),
  
  like: (id: string) =>
    api.post<{ message: string; post: Post }>(`/posts/${id}/like`),
  
  unlike: (id: string) =>
    api.delete<{ message: string; post: Post }>(`/posts/${id}/like`),
  
  addComment: (id: string, text: string) =>
    api.post<{ message: string; comment: Comment }>(`/posts/${id}/comments`, { text }),
  
  deleteComment: (postId: string, commentId: string) =>
    api.delete<{ message: string }>(`/posts/${postId}/comments/${commentId}`),
}

// Users API
export const usersApi = {
  getProfile: () =>
    api.get<User>('/users/me/profile'),
  
  updateProfile: (name?: string, status?: string) =>
    api.put<{ message: string; user: User }>('/users/me/profile', { name, status }),
}

export default api

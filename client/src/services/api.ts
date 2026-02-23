import axios, { AxiosError } from 'axios'
import type { User, Post, AuthResponse, ApiError, PaginatedResponse } from '@/types'

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
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

// ==================== AUTH API ====================
export const authApi = {
  signup: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/signup', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  getMe: () => api.get<User>('/users/me/profile'),
}

// ==================== POSTS API ====================
export const postsApi = {
  getAll: (page = 1, limit = 10) => api.get<PaginatedResponse<Post>>(`/posts?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get<Post>(`/posts/${id}`),
  getUserPosts: (userId: string) => api.get<Post[]>(`/posts/user/${userId}`),
  create: (title: string, content: string, imageUrl?: string) =>
    api.post<{ message: string; post: Post }>('/posts', { title, content, imageUrl }),
  update: (id: string, title: string, content: string, imageUrl?: string) =>
    api.put<{ message: string; post: Post }>(`/posts/${id}`, { title, content, imageUrl }),
  delete: (id: string) => api.delete<{ message: string }>(`/posts/${id}`),
  like: (id: string) => api.post<Post>(`/posts/${id}/like`),
  unlike: (id: string) => api.post<Post>(`/posts/${id}/unlike`),
  addComment: (postId: string, text: string) =>
    api.post<{ message: string; post: Post }>(`/posts/${postId}/comment`, { text }),
  deleteComment: (postId: string, commentId: string) =>
    api.delete<{ message: string; post: Post }>(`/posts/${postId}/comment/${commentId}`),
}

// ==================== USERS API ====================
export const usersApi = {
  getProfile: () => api.get<User>('/users/me/profile'),

  updateProfile: (data: {
    name?: string;
    status?: string;
    location?: string;
    website?: string
  }) => api.put<{ message: string; user: User }>('/users/me/profile', data),

  uploadProfilePicture: (formData: FormData) =>
    api.post<{ message: string; user: User }>('/users/me/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadCoverPicture: (formData: FormData) =>
    api.post<{ message: string; user: User }>('/users/me/cover-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getById: (id: string) => api.get<User>(`/users/${id}`),

  // NEW: Follow/Unfollow
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollow: (userId: string) => api.post(`/users/${userId}/unfollow`),
  getSuggestions: () => api.get<User[]>('/users/suggestions'),
  search: (query: string) => api.get<User[]>(`/users/search?q=${query}`),

  // NEW: Bookmarks
  getBookmarks: () => api.get<Post[]>('/users/me/bookmarks'),
  addBookmark: (postId: string) => api.post(`/users/me/bookmarks/${postId}`),
  removeBookmark: (postId: string) => api.delete(`/users/me/bookmarks/${postId}`),
}

// ==================== STORIES API (NEW) ====================
export const storiesApi = {
  getAll: () => api.get('/stories'),
  create: (formData: FormData) =>
    api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  view: (storyId: string) => api.post(`/stories/${storyId}/view`),
  delete: (storyId: string) => api.delete(`/stories/${storyId}`),
}

// ==================== NOTIFICATIONS API ====================
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
}

// ==================== MESSAGES API ====================
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (recipientId: string) =>
    api.post('/messages/conversations', { recipientId }),
  getMessages: (conversationId: string) =>
    api.get(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    api.post(`/messages/conversations/${conversationId}/messages`, { text }),
  sendMessageWithAttachment: (conversationId: string, formData: FormData) =>
    api.post(`/messages/conversations/${conversationId}/messages/with-attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default api

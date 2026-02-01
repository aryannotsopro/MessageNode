import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { postsApi } from '@/services/api'
import { Navbar } from '@/components/ui/Navbar'
import { CreatePost } from '@/components/ui/CreatePost'
import { PostCard } from '@/components/ui/PostCard'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { Toast, ToastContainer } from '@/components/ui/Toast'
import { RefreshCw, MessageSquare } from 'lucide-react'
import type { Post, ToastType } from '@/types'

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchPosts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const { data } = await postsApi.getAll()
      setPosts(data.posts)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      showToast('Failed to load posts', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPosts(false)
    setRefreshing(false)
  }

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreatePost = async (postData: { title: string; content: string; imageUrl: string }) => {
    try {
      await postsApi.create(postData.title, postData.content, postData.imageUrl)
      await fetchPosts(false)
      showToast('Post created successfully!', 'success')
    } catch (err: any) {
      console.error('Failed to create post:', err)
      showToast(err.response?.data?.message || 'Failed to create post', 'error')
      throw err
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId)
      if (!post) return

      const isLiked = post.likes.includes(user?._id || '')
      
      if (isLiked) {
        await postsApi.unlike(postId)
      } else {
        await postsApi.like(postId)
      }
      
      await fetchPosts(false)
    } catch (err) {
      console.error('Failed to toggle like:', err)
      showToast('Failed to like post', 'error')
    }
  }

  const handleComment = async (postId: string, text: string) => {
    try {
      await postsApi.addComment(postId, text)
      await fetchPosts(false)
      showToast('Comment added!', 'success')
    } catch (err: any) {
      console.error('Failed to add comment:', err)
      showToast(err.response?.data?.message || 'Failed to add comment', 'error')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await postsApi.delete(postId)
      await fetchPosts(false)
      showToast('Post deleted successfully!', 'success')
    } catch (err) {
      console.error('Failed to delete post:', err)
      showToast('Failed to delete post', 'error')
    }
  }

  const userId = localStorage.getItem('userId') || undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      
      {/* Toast */}
      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </ToastContainer>
      
      <main className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Create Post Section */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <CreatePost onSubmit={handleCreatePost} />
            </motion.div>
          )}

          {/* Posts Feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Latest Posts
              </h2>
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
              </motion.button>
            </div>

            {/* Posts List */}
            {loading ? (
              <FeedSkeleton count={3} />
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-50 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No posts yet</h3>
                <p className="text-slate-500 mb-6">Be the first to share something with the community!</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <PostCard
                        post={post}
                        currentUserId={userId}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={handleDeletePost}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

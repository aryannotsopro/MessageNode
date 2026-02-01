import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { usersApi, postsApi } from '@/services/api'
import { Navbar } from '@/components/ui/Navbar'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PostCard } from '@/components/ui/PostCard'
import { ProfileSkeleton } from '@/components/ui/Skeleton'
import { Toast, ToastContainer } from '@/components/ui/Toast'
import { Edit2, Mail, Calendar, FileText, Heart, MessageCircle, Check, X } from 'lucide-react'
import type { Post, ToastType, User } from '@/types'

export default function Profile() {
  const { user: currentUser, refreshUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const [profileRes, postsRes] = await Promise.all([
        usersApi.getProfile(),
        postsApi.getAll(1, 100), // Get all posts to filter
      ])
      setUser(profileRes.data)
      setEditName(profileRes.data.name)
      setEditStatus(profileRes.data.status || '')
      
      // Filter posts by current user
      const userPosts = postsRes.data.posts.filter(
        (post: Post) => post.creator._id === profileRes.data._id
      )
      setPosts(userPosts)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      showToast('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await usersApi.updateProfile(editName, editStatus)
      await refreshUser()
      await fetchProfile()
      setIsEditing(false)
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      console.error('Failed to update profile:', err)
      showToast('Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(user?.name || '')
    setEditStatus(user?.status || '')
    setIsEditing(false)
  }

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId)
      if (!post) return

      const isLiked = post.likes.includes(currentUser?._id || '')
      
      if (isLiked) {
        await postsApi.unlike(postId)
      } else {
        await postsApi.like(postId)
      }
      
      await fetchProfile()
    } catch (err) {
      console.error('Failed to toggle like:', err)
      showToast('Failed to like post', 'error')
    }
  }

  const handleComment = async (postId: string, text: string) => {
    try {
      await postsApi.addComment(postId, text)
      await fetchProfile()
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
      await fetchProfile()
      showToast('Post deleted successfully!', 'success')
    } catch (err) {
      console.error('Failed to delete post:', err)
      showToast('Failed to delete post', 'error')
    }
  }

  const userId = localStorage.getItem('userId') || undefined

  const stats = [
    { label: 'Posts', value: posts.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Likes Received', value: posts.reduce((acc, post) => acc + post.likes.length, 0), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Comments', value: posts.reduce((acc, post) => acc + post.comments.length, 0), icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <ProfileSkeleton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      
      {/* Toast */}
      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </ToastContainer>
      
      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              {/* Cover */}
              <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />
              
              <CardContent className="relative pt-0">
                <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar name={user?.name || ''} size="xl" className="border-4 border-white shadow-lg" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 mt-4 md:mt-0 md:ml-6 md:mb-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full md:w-auto px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Your name"
                        />
                        <input
                          type="text"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full md:w-auto px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Your status"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
                        <p className="text-slate-500">{user?.status || 'No status set'}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 md:mt-0 md:mb-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<X className="w-4 h-4" />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          isLoading={isSaving}
                          leftIcon={<Check className="w-4 h-4" />}
                          onClick={handleSaveProfile}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="text-center p-6">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Posts</h2>
            
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
                <p className="text-slate-500">Start sharing your thoughts with the world!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={userId}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

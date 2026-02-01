import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, ChevronDown, ChevronUp, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { LikeButton } from './LikeButton'
import { Card, CardContent } from './Card'
import { cn, formatDate } from '@/lib/utils'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
  currentUserId?: string
  onLike: (postId: string) => void
  onComment: (postId: string, text: string) => void
  onDelete?: (postId: string) => void
  onEdit?: (post: Post) => void
}

export function PostCard({ 
  post, 
  currentUserId, 
  onLike, 
  onComment, 
  onDelete,
  onEdit 
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false
  const isOwner = currentUserId === post.creator._id

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      onComment(post._id, commentText)
      setCommentText('')
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card hover className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="px-5 py-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={post.creator.name} size="md" />
              <div>
                <h4 className="font-semibold text-slate-900">{post.creator.name}</h4>
                <p className="text-sm text-slate-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10"
                    >
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(post)
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(post._id)
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-5 pb-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Image */}
          {post.imageUrl && (
            <div className="px-5 pb-4">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative rounded-xl overflow-hidden bg-slate-100"
              >
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full max-h-[400px] object-cover"
                  loading="lazy"
                />
              </motion.div>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-3">
            <LikeButton
              likes={post.likes.length}
              isLiked={isLiked}
              onLike={() => onLike(post._id)}
              disabled={!currentUserId}
            />
            
            <motion.button
              onClick={() => setShowComments(!showComments)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
                showComments
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
              {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-slate-50/50"
              >
                <div className="p-5 space-y-4">
                  {/* Comment Input */}
                  {currentUserId && (
                    <form onSubmit={handleSubmitComment} className="flex gap-3">
                      <Avatar name="You" size="sm" />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className={cn(
                            'flex-1 px-4 py-2.5 rounded-xl border bg-white text-sm',
                            'placeholder:text-slate-400',
                            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                            'border-slate-200'
                          )}
                        />
                        <motion.button
                          type="submit"
                          disabled={!commentText.trim()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'p-2.5 rounded-xl bg-indigo-600 text-white transition-colors',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'hover:bg-indigo-700'
                          )}
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </form>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {post.comments?.length > 0 ? (
                      post.comments.map((comment, index) => (
                        <motion.div
                          key={comment._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-3"
                        >
                          <Avatar name={comment.author.name} size="sm" />
                          <div className="flex-1 bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm text-slate-900">{comment.author.name}</p>
                              <p className="text-xs text-slate-400">{formatDate(comment.createdAt)}</p>
                            </div>
                            <p className="text-slate-700 text-sm">{comment.text}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-4 text-sm">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.article>
  )
}

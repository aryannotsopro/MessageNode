import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Image, Type, AlignLeft, Send, Loader2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface CreatePostProps {
  onSubmit: (data: { title: string; content: string; imageUrl: string }) => Promise<void>
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ title, content, imageUrl })
      // Reset form
      setTitle('')
      setContent('')
      setImageUrl('')
      setIsExpanded(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setTitle('')
    setContent('')
    setImageUrl('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className={cn(
        'rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-300',
        isExpanded ? 'border-indigo-200 shadow-lg shadow-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
      )}>
        {/* Collapsed State */}
        {!isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <Avatar name={user?.name || ''} size="md" />
            <div className="flex-1">
              <p className="text-slate-500 font-medium">
                What's on your mind, {user?.name?.split(' ')[0]}?
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
          </motion.button>
        )}

        {/* Expanded Form */}
        <AnimatePresence>
          {isExpanded && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.name || ''} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-sm text-slate-500">Creating a post</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Title Input */}
                <div className="relative">
                  <Type className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a title..."
                    className={cn(
                      'w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm font-semibold',
                      'placeholder:text-slate-400 placeholder:font-normal',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                      'border-slate-200'
                    )}
                    autoFocus
                  />
                </div>

                {/* Content Input */}
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className={cn(
                      'w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm',
                      'placeholder:text-slate-400',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                      'border-slate-200 resize-none'
                    )}
                  />
                </div>

                {/* Image URL Input */}
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Add an image URL (optional)..."
                    className={cn(
                      'w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm',
                      'placeholder:text-slate-400',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                      'border-slate-200'
                    )}
                  />
                </div>

                {/* Image Preview */}
                <AnimatePresence>
                  {imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl overflow-hidden bg-slate-100"
                    >
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full max-h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!title.trim() || !content.trim() || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl font-semibold text-white',
                      'bg-gradient-to-r from-indigo-600 to-violet-600',
                      'hover:from-indigo-700 hover:to-violet-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

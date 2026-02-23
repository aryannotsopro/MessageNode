import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Image, Type, AlignLeft, Loader2, Sparkles } from 'lucide-react'
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

  const cardStyle = {
    background: 'rgba(13,17,28,0.85)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.22)' : 'rgba(0,229,255,0.08)'}`,
    boxShadow: isExpanded ? '0 0 30px rgba(0,229,255,0.06), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {/* Collapsed State */}
        {!isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 flex items-center gap-3 text-left transition-all"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.997 }}
            style={{ background: 'transparent' }}
          >
            <Avatar name={user?.name || ''} size="md" />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                What's on your mind, {user?.name?.split(' ')[0]}?
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}
            >
              <Plus className="w-5 h-5" style={{ color: '#00e5ff' }} />
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
                      <p className="font-semibold text-white/85 text-sm">{user?.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(0,229,255,0.5)' }}>Transmitting a post</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(0,229,255,0.07)' }} />

                {/* Title Input */}
                <div className="relative">
                  <Type className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'rgba(0,229,255,0.4)' }} />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title..."
                    className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold"
                    autoFocus
                  />
                </div>

                {/* Content Input */}
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'rgba(0,229,255,0.4)' }} />
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl text-sm resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,229,255,0.4)' }} />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL (optional)..."
                    className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  />
                </div>

                {/* Image Preview */}
                <AnimatePresence>
                  {imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(0,229,255,0.12)' }}
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

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!title.trim() || !content.trim() || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl font-bold text-sm',
                      'flex items-center justify-center gap-2',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      'btn-neon-solid'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Transmit
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

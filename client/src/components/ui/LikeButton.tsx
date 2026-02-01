import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  likes: number
  isLiked: boolean
  onLike: () => void
  disabled?: boolean
}

interface Particle {
  id: number
  angle: number
}

export function LikeButton({ likes, isLiked, onLike, disabled }: LikeButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isBursting, setIsBursting] = useState(false)

  const handleClick = () => {
    if (disabled) return

    if (!isLiked) {
      // Create heart burst particles
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 45) * (Math.PI / 180),
      }))
      setParticles(newParticles)
      setIsBursting(true)

      setTimeout(() => {
        setParticles([])
        setIsBursting(false)
      }, 600)
    }

    onLike()
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
        isLiked
          ? 'bg-rose-50 text-rose-600'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="relative">
        <motion.span
          animate={isBursting ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.4, type: 'spring', stiffness: 400 }}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all duration-200',
              isLiked && 'fill-current'
            )}
          />
        </motion.span>

        {/* Particle Burst */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              initial={{ scale: 0.5, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: 0,
                opacity: 0,
                x: Math.cos(particle.angle) * 40,
                y: Math.sin(particle.angle) * 40,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
            </motion.span>
          ))}
        </AnimatePresence>
      </span>

      <motion.span
        key={likes}
        initial={isBursting ? { y: -10, opacity: 0 } : {}}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {likes}
      </motion.span>
    </motion.button>
  )
}

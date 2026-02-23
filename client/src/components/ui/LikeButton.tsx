import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'

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
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-black transition-all duration-300 group/like"
      style={{
        background: isLiked ? 'rgba(var(--primary-rgb), 0.12)' : 'rgba(var(--primary-rgb), 0.03)',
        border: `1px solid ${isLiked ? 'rgba(var(--primary-rgb), 0.3)' : 'transparent'}`,
        color: isLiked ? 'rgb(var(--primary-rgb))' : 'var(--muted-foreground)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span className="relative flex items-center justify-center">
        <motion.span
          animate={isBursting ? { scale: [1, 2, 1] } : {}}
          transition={{ duration: 0.5, type: 'spring', stiffness: 500 }}
          className="z-10"
        >
          <Heart
            className="transition-all duration-300"
            style={{
              width: '20px',
              height: '20px',
              fill: isLiked ? 'rgb(var(--primary-rgb))' : 'none',
              stroke: isLiked ? 'rgb(var(--primary-rgb))' : 'currentColor',
              strokeWidth: isLiked ? '0' : '2.5'
            }}
          />
        </motion.span>

        {/* Particle Burst */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              initial={{ scale: 0.8, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: 0,
                opacity: 0,
                x: Math.cos(particle.angle) * 45,
                y: Math.sin(particle.angle) * 45,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="absolute pointer-events-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            </motion.span>
          ))}
        </AnimatePresence>
      </span>

      <motion.span
        key={likes}
        initial={isBursting ? { y: -10, opacity: 0 } : {}}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'backOut' }}
        className="text-[15px] font-black tracking-tight"
      >
        {likes}
      </motion.span>
    </motion.button>
  )
}

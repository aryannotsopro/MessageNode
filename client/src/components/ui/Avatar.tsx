import { motion } from 'framer-motion'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showOnline?: boolean
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ name, src, size = 'md', className, showOnline }: AvatarProps) {
  return (
    <div className="relative inline-block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center font-semibold text-white',
          'bg-gradient-to-br',
          getAvatarColor(name),
          sizes[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          getInitials(name)
        )}
      </motion.div>
      {showOnline && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ background: '#00ff88', borderColor: '#060b14' }}
        />
      )}
    </div>
  )
}

export function AvatarSkeleton({ size = 'md', className }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return (
    <div
      className={cn('rounded-full shimmer', sizes[size], className)}
      style={{ background: 'rgba(13,17,28,0.8)', border: '1px solid rgba(0,229,255,0.08)' }}
    />
  )
}

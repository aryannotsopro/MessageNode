import { motion } from 'framer-motion';
import { UserPlus, Check } from 'lucide-react';
import { useState } from 'react';

const suggestions = [
  { name: 'Emma Wilson', handle: '@emma', image: 'https://i.pravatar.cc/150?img=5', role: 'Product' },
  { name: 'David Kim', handle: '@dkim', image: 'https://i.pravatar.cc/150?img=11', role: 'Builder' },
  { name: 'Lisa Chen', handle: '@lisa', image: 'https://i.pravatar.cc/150?img=9', role: 'Artist' },
];

export function WhoToFollow() {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggle = (handle: string) => {
    setFollowed(prev => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(13,17,28,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,229,255,0.08)',
      }}
    >
      {/* Header */}
      <h3 className="font-bold text-white/90 text-sm mb-5">Who to follow</h3>

      <div className="space-y-3">
        {suggestions.map((user, i) => {
          const isFollowing = followed.has(user.handle);
          return (
            <motion.div
              key={user.handle}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 group"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid rgba(0,229,255,0.15)' }}
                />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border"
                  style={{ background: '#00ff88', borderColor: '#060b14' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white/85 text-sm truncate group-hover:text-white transition-colors">
                  {user.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'rgba(0,229,255,0.45)' }}>
                  {user.handle} · {user.role}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggle(user.handle)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0"
                style={isFollowing ? {
                  background: 'rgba(0,229,255,0.12)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: '#00e5ff',
                } : {
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.18)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {isFollowing ? (
                  <><Check className="w-3 h-3" /> Following</>
                ) : (
                  <><UserPlus className="w-3 h-3" /> Follow</>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 btn-neon">
        View more
      </button>
    </div>
  );
}
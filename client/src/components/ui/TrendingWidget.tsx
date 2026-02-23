import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const trends = [
  { category: 'World News', tag: '#México', posts: '45.2K posts', hot: true },
  { category: 'Entertainment', tag: '#BBB26', posts: '1.2M posts', hot: true },
  { category: 'Sports', tag: '#INDvsSA', posts: '89K posts', hot: false },
  { category: 'Trending', tag: '#Valentine', posts: '534K posts', hot: true },
];

export function TrendingWidget() {
  return (
    <div
      className="rounded-[2.5rem] p-6 bg-background border border-border/40 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20 text-primary animate-pulse"
        >
          <TrendingUp className="w-5 h-5" />
        </div>
        <h3 className="font-extrabold text-foreground text-base tracking-tight text-nowrap">Trending for you</h3>
      </div>

      <div className="space-y-3">
        {trends.map((trend, i) => (
          <motion.div
            key={trend.tag}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="cursor-pointer group rounded-2xl p-3 transition-all duration-300 hover:bg-secondary/50 border border-transparent hover:border-border/40"
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap overflow-hidden">
                {trend.category}
              </p>
              {trend.hot && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20"
                >
                  HOT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors tracking-tight">
                #{trend.tag.replace('#', '')}
              </span>
            </div>
            <p className="text-[12px] mt-1 font-medium text-muted-foreground">{trend.posts}</p>
          </motion.div>
        ))}
      </div>

      <a
        href="https://trends24.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <button
          className="w-full mt-4 py-3.5 text-sm font-black rounded-[1.25rem] transition-all bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-xl hover:shadow-primary/20 tracking-widest uppercase"
        >
          Show more
        </button>
      </a>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storiesApi } from '@/services/api';
import type { StoryGroup } from '@/types';

export function Stories() {
  const { user } = useAuth();
  const [storiesGroups, setStoriesGroups] = useState<StoryGroup[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    try {
      const res = await storiesApi.getAll();
      if (res.data) setStoriesGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      await storiesApi.create(formData);
      await fetchStories();
    } catch (err) {
      console.error('Failed to upload story:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleViewStory = async (group: StoryGroup) => {
    if (!group.stories.length) return;
    setActiveStoryGroup(group);
    setActiveStoryIndex(0);

    const unviewedStory = group.stories[0];
    if (!unviewedStory.viewers.includes(user?._id || '')) {
      await storiesApi.view(unviewedStory._id);
      fetchStories(); // Refresh viewers
    }
  };

  const nextStory = async () => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      setActiveStoryIndex(nextIdx);
      const story = activeStoryGroup.stories[nextIdx];
      if (!story.viewers.includes(user?._id || '')) {
        await storiesApi.view(story._id);
        fetchStories();
      }
    } else {
      setActiveStoryGroup(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2.5rem] p-5 mb-8 scrollbar-hide bg-background border border-border/40 shadow-sm"
    >
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-3 min-w-[72px]">
          <div className="relative cursor-pointer group/mystory" onClick={() => fileInputRef.current?.click()}>
            <div className="w-[72px] h-[72px] rounded-3xl p-0.5 border-2 border-dashed border-primary/30 group-hover/mystory:border-primary/60 transition-all">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-secondary">
                <img
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                  className="w-full h-full object-cover grayscale-[0.2] group-hover/mystory:grayscale-0 transition-all"
                  alt="Your story"
                />
              </div>
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-2xl flex items-center justify-center text-primary-foreground bg-primary shadow-lg border-2 border-background"
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 font-black" />}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleCreateStory}
            />
          </div>
          <span className="text-[12px] font-bold text-muted-foreground truncate w-16 text-center">You</span>
        </div>

        {/* Other Stories */}
        {storiesGroups.map((group) => {
          const isCurrentUser = group.user._id === user?._id;
          const label = isCurrentUser ? 'My Story' : group.user.name;

          return (
            <motion.div
              key={group.user._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 min-w-[72px] cursor-pointer group"
              onClick={() => handleViewStory(group)}
            >
              <div
                className={`w-[72px] h-[72px] rounded-3xl transition-all duration-300 group-hover:scale-105 p-0.5 shadow-sm ${group.hasUnviewed
                  ? 'bg-gradient-to-br from-primary via-primary/80 to-primary/60'
                  : 'bg-secondary'
                  }`}
              >
                <div className="w-full h-full rounded-2xl overflow-hidden bg-background border-2 border-background">
                  <img
                    src={group.user.profilePicture || `https://ui-avatars.com/api/?name=${group.user.name}&background=random`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={label}
                  />
                </div>
              </div>
              <span className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate w-20 text-center tracking-tight">
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={nextStory}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveStoryGroup(null);
              }}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Current Story Content */}
            <motion.div
              key={activeStoryGroup.stories[activeStoryIndex]?._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="relative max-w-md w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Progress Bars */}
              <div className="absolute top-0 left-0 right-0 w-full flex gap-1 p-4 z-20">
                {activeStoryGroup.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{
                        width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? '100%' : '0%'
                        // In a real app we'd animate the current one over 5s
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header (User Info) */}
              <div className="absolute top-8 left-0 right-0 p-4 flex items-center gap-3 z-20">
                <img
                  src={activeStoryGroup.user.profilePicture || `https://ui-avatars.com/api/?name=${activeStoryGroup.user.name}`}
                  className="w-8 h-8 rounded-full border border-white/20"
                  alt={activeStoryGroup.user.name}
                />
                <span className="text-white font-medium text-sm drop-shadow-md">
                  {activeStoryGroup.user.name}
                </span>
              </div>

              {/* Story Image */}
              <img
                src={activeStoryGroup.stories[activeStoryIndex]?.imageUrl}
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
                alt="Story content"
                onClick={nextStory}
              />

              {/* Caption */}
              {activeStoryGroup.stories[activeStoryIndex]?.caption && (
                <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                  <span className="bg-black/50 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-md">
                    {activeStoryGroup.stories[activeStoryIndex].caption}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

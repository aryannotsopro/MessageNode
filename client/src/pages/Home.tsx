import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { postsApi } from '@/services/api';
import { Sidebar } from '@/components/ui/Sidebar';
import { Stories } from '@/components/ui/Stories';
import { PostCard } from '@/components/ui/PostCard';
import { CreatePost } from '@/components/ui/CreatePost';
import { TrendingWidget } from '@/components/ui/TrendingWidget';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import type { Post, ToastType } from '@/types';

export default function Home() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data } = await postsApi.getAll(pageNum, 10);

      if (isInitial) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, page, fetchPosts]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreatePost = async (postData: { title: string; content: string; imageUrl: string }) => {
    try {
      await postsApi.create(postData.title, postData.content, postData.imageUrl);
      await fetchPosts(1, true);
      showToast('Post created successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create post', 'error');
      throw err;
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId);
      if (!post) return;
      const isLiked = post.likes?.includes(user?._id || '');
      if (isLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
      // Optimistic upate or refetch current page? 
      // For now, let's just update the local state to avoid full refetch
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const newLikes = isLiked
            ? p.likes.filter(id => id !== user?._id)
            : [...p.likes, user?._id || ''];
          return { ...p, likes: newLikes };
        }
        return p;
      }));
    } catch (err) {
      showToast('Failed to like post', 'error');
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      const { data } = await postsApi.addComment(postId, text);
      // Update local state with the returned post
      setPosts(prev => prev.map(p => p._id === postId ? (data as any) : p));
      showToast('Comment added!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const { data } = await postsApi.deleteComment(postId, commentId);
      // Update local state
      setPosts(prev => prev.map(p => p._id === postId ? (data as any) : p));
      showToast('Comment deleted', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete comment', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await postsApi.delete(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post deleted', 'success');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Sidebar />

      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </ToastContainer>

      <main className="pl-0 md:pl-20 xl:pl-64 xl:pr-80 min-h-screen pb-24 md:pb-6 transition-all duration-500">
        <div className="max-w-2xl mx-auto py-6 md:py-8 px-4 sm:px-6">

          {/* Stories */}
          <Stories />

          {/* Create Post */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <CreatePost onSubmit={handleCreatePost} />
            </motion.div>
          )}

          {/* Feed */}
          <div className="space-y-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-[2.5rem] h-64 bg-secondary/30 border border-border/40 animate-pulse"
                />
              ))
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 px-6 rounded-[2.5rem] bg-secondary/20 border border-dashed border-border/60"
              >
                <div
                  className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/10 rotate-3"
                >
                  <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-2xl font-black mb-3 text-foreground tracking-tight">Your feed is quiet</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto">Follow more people or start the conversation by sharing your first post!</p>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index % 10 * 0.04 }} // Only delay first few in batch
                      layout
                    >
                      <PostCard
                        post={post}
                        currentUserId={user?._id}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={handleDeletePost}
                        onDeleteComment={handleDeleteComment}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading More / Sentinel */}
                <div ref={observerRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-3 text-primary/60 font-bold">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting more signals...</span>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-40">
                      End of transmission
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar — only xl+ */}
      <aside className="fixed right-0 top-0 w-80 h-screen overflow-y-auto p-5 hidden xl:block scrollbar-hide">
        <div className="space-y-5 pt-4">
          <TrendingWidget />
        </div>
      </aside>
    </div>
  );
}
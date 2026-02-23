import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usersApi, postsApi } from '@/services/api';
import { PostCard } from '@/components/ui/PostCard';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Post, ToastType } from '@/types';

export default function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data } = await usersApi.getBookmarks();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      const isLiked = post.likes?.some((id: string) => id.toString() === user?._id?.toString());
      if (isLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
      await fetchBookmarks();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      await postsApi.addComment(postId, text);
      await fetchBookmarks();
      showToast('Comment added!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await postsApi.deleteComment(postId, commentId);
      await fetchBookmarks();
      showToast('Comment deleted', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete comment', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-rose-500 text-white' :
              'bg-violet-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pl-64 min-h-screen">
        <div className="max-w-2xl mx-auto pb-20">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-200/50">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">Bookmarks</h1>
              <p className="text-sm text-slate-500">{posts.length} saved posts</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
              ))
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id}
                  isBookmarked={true}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDeleteComment={handleDeleteComment}
                  onBookmarkChange={fetchBookmarks}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No bookmarks yet</p>
                <p className="text-sm text-slate-400 mt-1">Save posts to view them here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
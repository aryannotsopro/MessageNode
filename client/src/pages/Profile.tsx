import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  ArrowLeft,
  Edit3,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, usersApi } from '@/services/api';
import { PostCard } from '@/components/ui/PostCard';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Post, ToastType, User as UserType } from '@/types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'media'>('posts');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLikedPosts = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      const { data } = await postsApi.getAll();
      const allPosts = (data as any)?.posts || data || [];
      const userId = currentUser._id.toString();
      const userLiked = allPosts.filter((post: Post) =>
        post.likes?.some((likeId: string) => likeId.toString() === userId)
      );
      setLikedPosts(userLiked);
    } catch (error) {
      console.error('Failed to fetch liked posts:', error);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (id && id !== currentUser?._id) {
          // View other user
          const { data } = await usersApi.getById(id);
          setProfileUser(data);
          // Fetch their posts
          const postsRes = await postsApi.getUserPosts(id);
          const postsData = (postsRes.data as any)?.posts || postsRes.data || [];
          setPosts(Array.isArray(postsData) ? postsData : []);
          setLikedPosts([]); // Privacy/Complexity: don't show other user's likes for now
        } else if (currentUser) {
          // View my own profile
          setProfileUser(currentUser);
          const postsRes = await postsApi.getUserPosts(currentUser._id);
          const postsData = (postsRes.data as any)?.posts || postsRes.data || [];
          setPosts(Array.isArray(postsData) ? postsData : []);
          fetchLikedPosts();

          setEditName(currentUser.name || '');
          setEditStatus(currentUser.status || '');
          setEditLocation(currentUser.location || '');
          setEditWebsite(currentUser.website || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('User not found', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentUser, fetchLikedPosts]);

  const fetchUserPosts = async () => {
    if (!profileUser?._id) return;
    try {
      const { data } = await postsApi.getUserPosts(profileUser._id);
      const postsData = (data as any)?.posts || data || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({
        name: editName,
        status: editStatus,
        location: editLocation,
        website: editWebsite
      });
      await refreshUser();
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('image', file);
      await usersApi.uploadProfilePicture(formData);
      await refreshUser();
      showToast('Profile picture updated!', 'success');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('image', file);
      await usersApi.uploadCoverPicture(formData);
      await refreshUser();
      showToast('Cover picture updated!', 'success');
    } catch (error) {
      console.error('Failed to upload cover picture:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setIsSaving(false);
    }
  }; const handleDelete = async (postId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this post?')) return;
      await postsApi.delete(postId);
      await fetchUserPosts();
      await fetchLikedPosts();
      showToast('Post deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete post:', error);
      showToast('Failed to delete post', 'error');
    }
  };


  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId) || likedPosts.find(p => p._id === postId);
      if (!post) return;
      const isLiked = post.likes?.some((userId: string) => userId.toString() === currentUser?._id?.toString());
      if (isLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
      await fetchUserPosts();
      await fetchLikedPosts();
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Failed to like post', 'error');
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      await postsApi.addComment(postId, text);
      await fetchUserPosts();
      await fetchLikedPosts();
      showToast('Comment added!', 'success');
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      showToast(error.response?.data?.message || 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await postsApi.deleteComment(postId, commentId);
      await fetchUserPosts();
      await fetchLikedPosts();
      showToast('Comment deleted', 'success');
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      showToast(error.response?.data?.message || 'Failed to delete comment', 'error');
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;
    try {
      const followingIds = currentUser?.following?.map((f) => typeof f === 'string' ? f : f._id) || [];
      const isFollowing = followingIds.includes(profileUser._id);

      if (isFollowing) {
        await usersApi.unfollow(profileUser._id);
      } else {
        await usersApi.follow(profileUser._id);
      }
      await refreshUser();
      showToast(isFollowing ? 'Unfollowed successfully' : 'Following now', 'success');
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  };

  const handleMessage = () => {
    if (!profileUser) return;
    navigate('/messages', { state: { userId: profileUser._id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser || !currentUser) return null;

  const isOwnProfile = profileUser._id === currentUser._id;
  const followingIds = currentUser.following?.map((f) => typeof f === 'string' ? f : f._id) || [];
  const isFollowing = followingIds.includes(profileUser._id);

  const mediaPosts = posts.filter(post => post.imageUrl && post.imageUrl.trim() !== '');

  const stats = [
    { label: 'Posts', value: posts.length },
    { label: 'Followers', value: profileUser.followers?.length || 0 },
    { label: 'Following', value: profileUser.following?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#060b14]">
      <Sidebar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-rose-500 text-white' :
                'bg-violet-600 text-white'
              }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pl-64 pr-80 min-h-screen">
        <div className="max-w-4xl mx-auto pb-20">
          {/* Back Button */}
          <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="px-6 py-4 flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-border"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground/70" />
              </button>
              <div>
                <h1 className="font-extrabold text-xl text-foreground tracking-tight">{profileUser.name}</h1>
                <p className="text-sm font-medium text-muted-foreground">{posts.length} posts</p>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div
            className="h-72 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden bg-cover bg-center"
            style={profileUser.coverPicture ? { backgroundImage: `url(${profileUser.coverPicture})` } : {}}
          >
            {!profileUser.coverPicture && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-30" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={coverInputRef}
              onChange={handleCoverUpload}
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isSaving}
              className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-4 bg-white/80 border-[1px] border-[rgba(0,0,0,0.08)] dark:bg-[rgba(13,17,28,0.8)] dark:border-[1px] dark:border-[rgba(0,229,255,0.08)]">
            <div className="flex justify-between items-end -mt-16 mb-4">
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl p-1.5 bg-background border-4 border-background shadow-2xl relative overflow-hidden -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img
                    src={profileUser.profilePicture || `https://ui-avatars.com/api/?name=${profileUser.name}&size=144`}
                    alt={profileUser.name}
                    className="w-full h-full rounded-2xl object-cover bg-background"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={profileInputRef}
                  onChange={handleProfileUpload}
                />
                <button
                  onClick={() => profileInputRef.current?.click()}
                  disabled={isSaving}
                  className="absolute bottom-2 right-2 p-2.5 bg-primary text-primary-foreground hover:scale-110 transition-transform rounded-2xl shadow-xl z-10 border-4 border-background"
                  title="Update profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {!isOwnProfile ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMessage}
                    className="p-3 rounded-2xl border border-border bg-background text-foreground hover:bg-secondary transition-all shadow-sm"
                    title="Send Message"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${isFollowing
                      ? 'bg-secondary text-secondary-foreground border border-border'
                      : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </motion.button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-3 bg-primary text-primary-foreground dark:text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profileUser.name}</h2>
            <p className="text-sm text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">@{profileUser.email?.split('@')[0]}</p>
          </div>

          {profileUser.status && (
            <p className="mt-3 text-slate-800 dark:text-[rgba(255,255,255,0.8)]">{profileUser.status}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500 dark:text-[rgba(255,255,255,0.4)]">
            {profileUser.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profileUser.location}
              </span>
            )}
            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-violet-600 dark:text-[#00e5ff]"
              >
                <LinkIcon className="w-4 h-4" />
                {profileUser.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {profileUser.createdAt ? format(new Date(profileUser.createdAt), 'MMMM yyyy') : 'N/A'}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-6 pt-6 border-t border-border">
            {stats.map((stat) => (
              <button key={stat.label} className="group flex flex-col items-start transition-all">
                <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none tracking-tight">{stat.value}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-14 bg-white/80 border-[1px] border-[rgba(0,0,0,0.08)] dark:bg-[rgba(13,17,28,0.8)] dark:border-[1px] dark:border-[rgba(0,229,255,0.08)]">
          <div className="flex">
            {[
              { id: 'posts', label: 'Posts', icon: MessageCircle },
              { id: 'media', label: 'Media', icon: ImageIcon },
              { id: 'likes', label: 'Likes', icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-5 text-sm font-black transition-all relative flex items-center justify-center gap-2 tracking-widest uppercase ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'fill-current' : ''}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary-rgb),0.3)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
                  ))
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={currentUser._id}
                      onLike={handleLike}
                      onComment={handleComment}
                      onDelete={isOwnProfile ? handleDelete : undefined}
                      onDeleteComment={isOwnProfile ? handleDeleteComment : undefined}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] rounded-full">
                      <MessageCircle className="w-10 h-10 mx-auto mb-4 text-slate-300 dark:text-[rgba(255,255,255,0.3)]" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-[rgba(255,255,255,0.6)]">No posts yet</p>
                    <p className="text-sm mt-1 text-slate-400 dark:text-[rgba(255,255,255,0.3)]">Share your first thought!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {mediaPosts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {mediaPosts.map((post) => (
                      <motion.div
                        key={post._id}
                        whileHover={{ scale: 0.98 }}
                        className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-slate-100"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-4 text-white">
                          <span className="flex items-center gap-1 font-bold">
                            <Heart className="w-5 h-5 fill-current" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1 font-bold">
                            <MessageCircle className="w-5 h-5" />
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] rounded-full">
                      <ImageIcon className="w-10 h-10 mx-auto mb-4 text-slate-300 dark:text-[rgba(255,255,255,0.3)]" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-[rgba(255,255,255,0.6)]">No media yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'likes' && (
              <motion.div
                key="likes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {likedPosts.length > 0 ? (
                  likedPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={currentUser._id}
                      onLike={handleLike}
                      onComment={handleComment}
                      onDelete={isOwnProfile ? handleDelete : undefined}
                      onDeleteComment={isOwnProfile ? handleDeleteComment : undefined}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] rounded-full">
                      <Heart className="w-10 h-10 mx-auto mb-4 text-slate-300 dark:text-[rgba(255,255,255,0.3)]" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-[rgba(255,255,255,0.6)]">No liked posts yet</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 w-80 h-screen overflow-y-auto p-6 hidden xl:block">
        <div className="pt-4">
          {/* Empty Space or Other Widget */}
        </div>
      </aside>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 w-full max-w-md shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            >
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Edit Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-white/60">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-white/60">Bio</label>
                  <textarea
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-white/60">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-white/60">Website</label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
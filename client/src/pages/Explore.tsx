import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    TrendingUp,
    Hash,
    Users,
    Heart,
    MessageCircle,
    ArrowLeft,
    Grid,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { postsApi, usersApi } from '@/services/api';
import { PostCard } from '@/components/ui/PostCard';
import { Sidebar } from '@/components/ui/Sidebar';
import type { Post, User, ToastType } from '@/types';

export default function Explore() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [posts, setPosts] = useState<Post[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'trending'>('posts');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchData();
        // Check if there's a search query passed from sidebar
        if (location.state?.query) {
            setSearchQuery(location.state.query);
            // We need handleSearch to run after state update or trigger it manually
        }
    }, []);

    useEffect(() => {
        if (location.state?.query) {
            handleSearch();
            // Clear location state to prevent repeat search on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state?.query]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [postsRes, usersRes] = await Promise.all([
                postsApi.getAll(),
                usersApi.getSuggestions(),
            ]);
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : ((postsRes.data as any)?.posts || []));
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchData();
            return;
        }

        try {
            setLoading(true);
            const [{ data: allPostsData }, { data: usersData }] = await Promise.all([
                postsApi.getAll(),
                usersApi.search(searchQuery)
            ]);

            const allPosts = (allPostsData as any)?.posts || allPostsData || [];

            const filteredPosts = allPosts.filter((post: Post) =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setPosts(filteredPosts);
            setUsers(usersData || []);
            if (usersData?.length > 0) setActiveTab('users');
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
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
            await fetchData();
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    const handleComment = async (postId: string, text: string) => {
        try {
            await postsApi.addComment(postId, text);
            await fetchData();
            showToast('Comment added!', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to add comment', 'error');
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        try {
            await postsApi.deleteComment(postId, commentId);
            await fetchData();
            showToast('Comment deleted', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete comment', 'error');
        }
    };

    const handleFollow = async (userId: string) => {
        try {
            const targetUser = users.find(u => u._id === userId);
            if (!targetUser) return;

            // Check if following (handle both string[] and User[] types)
            const followingIds = user?.following?.map((f) => typeof f === 'string' ? f : f._id) || [];
            const isFollowing = followingIds.includes(userId);
            if (isFollowing) {
                await usersApi.unfollow(userId);
            } else {
                await usersApi.follow(userId);
            }
            await fetchData();
            showToast(isFollowing ? 'Unfollowed successfully' : 'Following now', 'success');
        } catch (error) {
            console.error('Failed to follow:', error);
        }
    };

    const trendingTopics = [
        { tag: 'technology', posts: 1234 },
        { tag: 'programming', posts: 987 },
        { tag: 'webdevelopment', posts: 756 },
        { tag: 'ai', posts: 654 },
        { tag: 'javascript', posts: 543 },
        { tag: 'react', posts: 432 },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
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

            <main className="pl-0 md:pl-20 xl:pl-64 min-h-screen pb-24 md:pb-6">
                <div className="max-w-4xl mx-auto py-4 md:py-6 px-3 sm:px-4">

                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-white/60" />
                            </button>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Explore</h1>
                        </div>

                        {/* Search */}
                        <div
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                        >
                            <Search className="w-5 h-5 text-slate-400 dark:text-white/30" />
                            <input
                                type="text"
                                placeholder="Search posts, people, topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-white/30"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {['posts', 'users', 'trending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {tab === 'posts' && <Grid className="w-4 h-4" />}
                                {tab === 'users' && <Users className="w-4 h-4" />}
                                {tab === 'trending' && <TrendingUp className="w-4 h-4" />}
                                {tab === 'posts' ? 'Posts' : tab === 'users' ? 'People' : 'Trending'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl h-48 shimmer bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                                />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Posts Tab */}
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {posts.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-20"
                                        >
                                            <div
                                                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-cyan-900/30 border border-blue-200 dark:border-cyan-700/50"
                                            >
                                                <Grid className="w-10 h-10 text-blue-400 dark:text-cyan-500" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 text-slate-800/80 dark:text-white/80">No posts found</h3>
                                            <p className="text-blue-500/50 dark:text-cyan-500/50">Try searching for something else</p>
                                        </motion.div>
                                    ) : (
                                        posts.map((post, index) => (
                                            <motion.div
                                                key={post._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                            >
                                                <PostCard
                                                    post={post}
                                                    currentUserId={user?._id}
                                                    onLike={handleLike}
                                                    onComment={handleComment}
                                                    onDeleteComment={handleDeleteComment}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <div className="space-y-3">
                                    {users.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-20"
                                        >
                                            <div
                                                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-cyan-900/30 border border-blue-200 dark:border-cyan-700/50"
                                            >
                                                <Users className="w-10 h-10 text-blue-400 dark:text-cyan-500" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 text-foreground/80 dark:text-foreground/90">
                                                No users found
                                            </h3>
                                            <p className="text-blue-500/50 dark:text-cyan-500/50">Try searching for something else</p>
                                        </motion.div>
                                    ) : (
                                        users.map((u, index) => {
                                            // Check if following (handle both string[] and User[] types)
                                            const followingIds = user?.following?.map((f) => typeof f === 'string' ? f : f._id) || [];
                                            const isFollowing = followingIds.includes(u._id);
                                            const isCurrentUser = u._id === user?._id;

                                            return (
                                                <motion.div
                                                    key={u._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="p-5 rounded-[2rem] cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
                                                    onClick={() => navigate(`/profile/${u._id}`)}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative">
                                                            <img
                                                                src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&size=64`}
                                                                alt={u.name}
                                                                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 group-hover:border-primary/30 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div>
                                                                    <p className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{u.name}</p>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                        @{u.email.split('@')[0]}
                                                                    </p>
                                                                </div>
                                                                {!isCurrentUser && (
                                                                    <div className="flex items-center gap-2">
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleFollow(u._id);
                                                                            }}
                                                                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isFollowing
                                                                                ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                                                                                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                                                }`}
                                                                        >
                                                                            {isFollowing ? 'Following' : 'Follow'}
                                                                        </motion.button>
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate('/messages', { state: { userId: u._id } });
                                                                            }}
                                                                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                                                            title="Message User"
                                                                        >
                                                                            <MessageCircle className="w-5 h-5" />
                                                                        </motion.button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-6 mt-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 dark:text-white">{u.followers?.length || 0}</span>
                                                                    <span className="text-xs text-slate-500 uppercase tracking-wider">Followers</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 dark:text-white">{u.following?.length || 0}</span>
                                                                    <span className="text-xs text-slate-500 uppercase tracking-wider">Following</span>
                                                                </div>
                                                            </div>

                                                            {u.status && (
                                                                <p className="text-sm mt-3 text-slate-600 dark:text-slate-400 line-clamp-1">
                                                                    {u.status}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Trending Tab */}
                            {activeTab === 'trending' && (
                                <div className="space-y-4">
                                    {/* Trending Posts */}
                                    {posts.slice(0, 5).map((post, index) => (
                                        <motion.div
                                            key={post._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                                        >
                                            <div className="flex gap-4">
                                                <div className="text-2xl font-bold text-blue-400 dark:text-cyan-500">
                                                    #{index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white">{post.title}</h3>
                                                    <p className="text-sm line-clamp-2 mb-2 text-slate-500 dark:text-white/50">
                                                        {post.content}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-blue-400 dark:text-cyan-500">
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            {post.likes?.length || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle className="w-3 h-3" />
                                                            {post.comments?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Trending Topics */}
                                    <div className="mt-8">
                                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                            <Hash className="w-5 h-5 text-indigo-500 dark:text-cyan-500" />
                                            Trending Topics
                                        </h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            {trendingTopics.map((topic, index) => (
                                                <motion.div
                                                    key={topic.tag}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-4 rounded-xl cursor-pointer bg-blue-100/40 dark:bg-cyan-900/20 border border-blue-200/80 dark:border-cyan-700/30"
                                                    whileHover={{ scale: 1.02 }}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-cyan-500" />
                                                        <span className="font-medium text-slate-900 dark:text-white">#{topic.tag}</span>
                                                    </div>
                                                    <p className="text-xs text-blue-400 dark:text-cyan-500">
                                                        {topic.posts.toLocaleString()} posts
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
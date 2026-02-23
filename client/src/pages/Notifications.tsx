import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    Heart,
    MessageCircle,
    UserPlus,
    AtSign,
    CheckCheck,
    ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi } from '@/services/api';
import { Sidebar } from '@/components/ui/Sidebar';
import type { ToastType } from '@/types';

interface Notification {
    _id: string;
    sender: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    recipient: string;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
    text?: string;
    post?: {
        _id: string;
        title: string;
        content: string;
        imageUrl?: string;
    };
    read: boolean;
    createdAt: string;
}

const notificationIcons: Record<string, typeof Heart> = {
    like: Heart,
    comment: MessageCircle,
    follow: UserPlus,
    mention: AtSign,
    message: MessageCircle,
};

const notificationColors: Record<string, string> = {
    like: 'text-pink-500 bg-pink-500/10',
    comment: 'text-blue-500 bg-blue-500/10',
    follow: 'text-violet-500 bg-violet-500/10',
    mention: 'text-cyan-500 bg-cyan-500/10',
    message: 'text-green-500 bg-green-500/10',
};

export default function Notifications() {
    useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await notificationsApi.getAll();
            setNotifications(data || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            showToast('Failed to mark all as read', 'error');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }

        // Navigate based on type
        switch (notification.type) {
            case 'like':
            case 'comment':
            case 'mention':
                if (notification.post?._id) {
                    navigate(`/?post=${notification.post._id}`);
                }
                break;
            case 'follow':
                navigate(`/profile/${notification.sender._id}`);
                break;
            case 'message':
                navigate('/messages');
                break;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

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
                <div className="max-w-2xl mx-auto py-4 md:py-6 px-3 sm:px-4">
                    {/* Header */}
                    <div
                        className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 mb-4 rounded-2xl backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl transition-all hover:bg-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-white/60" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-blue-500/80 dark:text-cyan-500/60">
                                    {unreadCount} unread
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="p-2 rounded-xl transition-all hover:bg-white/5"
                                title="Mark all as read"
                            >
                                <CheckCheck className="w-5 h-5 text-primary" />
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-2">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl h-20 shimmer bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                                />
                            ))
                        ) : notifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20"
                            >
                                <div
                                    className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-cyan-900/30 border border-blue-200 dark:border-cyan-700/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.08)]"
                                >
                                    <Bell className="w-10 h-10 text-blue-400 dark:text-cyan-500/30" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800/80 dark:text-white/80 mb-2">All quiet</h3>
                                <p className="text-blue-500/50 dark:text-cyan-500/50">No notifications yet</p>
                            </motion.div>
                        ) : (
                            <AnimatePresence>
                                {notifications.map((notification, index) => {
                                    const Icon = notificationIcons[notification.type] || Bell;
                                    const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-500/10';

                                    return (
                                        <motion.div
                                            key={notification._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`
                        p-4 rounded-2xl cursor-pointer transition-all border
                        ${notification.read
                                                    ? 'opacity-60 hover:opacity-80 bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5'
                                                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-cyan-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(0,229,255,0.05)]'
                                                }
                      `}
                                        >
                                            <div className="flex gap-3">
                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={notification.sender.profilePicture || `https://ui-avatars.com/api/?name=${notification.sender.name}&size=40`}
                                                        alt={notification.sender.name}
                                                        className={`w-12 h-12 rounded-full object-cover border-2 ${notification.read ? 'border-slate-200 dark:border-cyan-500/20' : 'border-blue-400 dark:border-cyan-400'}`}
                                                    />
                                                    <div
                                                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${colorClass}`}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-900 dark:text-white/90">
                                                        <span className="font-semibold">{notification.sender.name}</span>
                                                        {' '}
                                                        {notification.type === 'like' && 'liked your post'}
                                                        {notification.type === 'comment' && 'commented on your post'}
                                                        {notification.type === 'follow' && 'started following you'}
                                                        {notification.type === 'mention' && 'mentioned you in a post'}
                                                        {notification.type === 'message' && 'sent you a message'}
                                                    </p>

                                                    {notification.text && (
                                                        <p
                                                            className="mt-1 text-sm line-clamp-2 text-slate-500 dark:text-white/50"
                                                        >
                                                            "{notification.text}"
                                                        </p>
                                                    )}

                                                    <p
                                                        className="mt-1.5 text-xs text-blue-400 dark:text-cyan-500/40"
                                                    >
                                                        {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>

                                                {/* Unread indicator */}
                                                {!notification.read && (
                                                    <div
                                                        className="w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-blue-500 dark:bg-cyan-400"
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Bell,
    Lock,
    Palette,
    HelpCircle,
    Info,
    LogOut,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sidebar } from '@/components/ui/Sidebar';
import type { ToastType } from '@/types';

interface SettingsItem {
    id: string;
    label: string;
    type?: 'toggle';
    value?: string | boolean;
    onClick?: () => void;
    onChange?: any; // Use any to accept both Dispatch and toggle function
}

interface SettingsSection {
    id: string;
    label: string;
    icon: typeof User;
    items: SettingsItem[];
}

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Theme toggles
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const settingsSections: SettingsSection[] = [
        {
            id: 'account',
            label: 'Account',
            icon: User,
            items: [
                { id: 'profile', label: 'Edit Profile', onClick: () => navigate('/profile') },
                { id: 'username', label: 'Username', value: user?.email?.split('@')[0] || 'user' },
                { id: 'email', label: 'Email', value: user?.email || 'user@example.com' },
                { id: 'password', label: 'Change Password', onClick: () => showToast('Password change not implemented yet', 'info') },
            ]
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            items: [
                {
                    id: 'emailNotif',
                    label: 'Email Notifications',
                    type: 'toggle',
                    value: emailNotifications,
                    onChange: setEmailNotifications
                },
                {
                    id: 'pushNotif',
                    label: 'Push Notifications',
                    type: 'toggle',
                    value: pushNotifications,
                    onChange: setPushNotifications
                },
            ]
        },
        {
            id: 'privacy',
            label: 'Privacy',
            icon: Lock,
            items: [
                {
                    id: 'private',
                    label: 'Private Account',
                    type: 'toggle',
                    value: privateAccount,
                    onChange: setPrivateAccount
                },
                {
                    id: 'online',
                    label: 'Show Online Status',
                    type: 'toggle',
                    value: showOnlineStatus,
                    onChange: setShowOnlineStatus
                },
            ]
        },
        {
            id: 'appearance',
            label: 'Appearance',
            icon: Palette,
            items: [
                {
                    id: 'darkmode',
                    label: 'Dark Mode',
                    type: 'toggle',
                    value: theme === 'dark',
                    onChange: toggleTheme
                },
            ]
        },
        {
            id: 'support',
            label: 'Support',
            icon: HelpCircle,
            items: [
                { id: 'help', label: 'Help Center', onClick: () => showToast('Help center not implemented yet', 'info') },
                { id: 'report', label: 'Report a Problem', onClick: () => showToast('Report feature not implemented yet', 'info') },
            ]
        },
        {
            id: 'about',
            label: 'About',
            icon: Info,
            items: [
                { id: 'version', label: 'Version', value: '1.0.0' },
                { id: 'terms', label: 'Terms of Service', onClick: () => showToast('Terms not implemented yet', 'info') },
                { id: 'privacy', label: 'Privacy Policy', onClick: () => showToast('Privacy policy not implemented yet', 'info') },
            ]
        },
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
                <div className="max-w-2xl mx-auto py-4 md:py-6 px-3 sm:px-4">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl hover:bg-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-white/60" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                    </div>

                    {/* Profile Summary */}
                    <div
                        className="p-4 rounded-2xl mb-6 bg-white/80 border-[1px] border-[rgba(0,0,0,0.08)] dark:bg-[rgba(13,17,28,0.8)] dark:border-[1px] dark:border-[rgba(0,229,255,0.08)]"
                    >
                        <div className="flex items-center gap-4">
                            <img
                                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&size=64`}
                                alt={user?.name}
                                className="w-16 h-16 rounded-full object-cover"
                                style={{ border: '2px solid rgba(0,229,255,0.3)' }}
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-lg text-slate-900 dark:text-white">{user?.name}</p>
                                <p className="text-sm text-[rgba(0,0,0,0.5)] dark:text-[rgba(255,255,255,0.5)]">@{user?.email?.split('@')[0]}</p>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-pink-500 text-white dark:from-cyan-500 dark:to-purple-500 dark:text-[#060b14]"
                            >
                                View Profile
                            </button>
                        </div>
                    </div>

                    {/* Settings Sections */}
                    <div className="space-y-4">
                        {settingsSections.map((section) => (
                            <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl overflow-hidden bg-white/80 border-[1px] border-[rgba(0,0,0,0.08)] dark:bg-[rgba(13,17,28,0.8)] dark:border-[1px] dark:border-[rgba(0,229,255,0.08)]"
                            >
                                {/* Section Header */}
                                <div
                                    className="px-4 py-3 flex items-center gap-3 border-b-[1px] border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] dark:border-[rgba(0,229,255,0.06)] dark:bg-[rgba(0,229,255,0.02)]"
                                >
                                    <section.icon className="w-5 h-5 text-indigo-500 dark:text-cyan-500" />
                                    <span className="font-semibold text-slate-900 dark:text-white">{section.label}</span>
                                </div>

                                {/* Section Items */}
                                <div>
                                    {section.items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`
                        px-4 py-3 flex items-center justify-between cursor-pointer transition-all
                        ${item.onClick ? 'hover:bg-white/5' : ''}
                      `}
                                            style={{
                                                borderBottom: index < section.items.length - 1
                                                    ? '1px solid rgba(0,229,255,0.04)'
                                                    : 'none'
                                            }}
                                            onClick={item.onClick}
                                        >
                                            <span className="text-slate-600 dark:text-white/60">{item.label}</span>

                                            {item.type === 'toggle' ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        item.onChange?.(!item.value);
                                                    }}
                                                    className={`
                            w-12 h-7 rounded-full transition-all relative
                            ${item.value ? 'bg-indigo-500 dark:bg-[#00e5ff]' : 'bg-slate-300 dark:bg-white/10'}
                          `}
                                                >
                                                    <motion.div
                                                        animate={{ x: item.value ? 22 : 2 }}
                                                        className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
                                                    />
                                                </button>
                                            ) : item.value ? (
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="text-sm text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]"
                                                    >
                                                        {item.value}
                                                    </span>
                                                    {item.onClick && (
                                                        <ChevronRight className="w-4 h-4 text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.3)]" />
                                                    )}
                                                </div>
                                            ) : item.onClick ? (
                                                <ChevronRight className="w-4 h-4 text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.3)]" />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* Logout Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 transition-all bg-rose-500/10 border-[1px] border-rose-500/20"
                        >
                            <LogOut className="w-5 h-5 text-rose-500" />
                            <span className="font-medium text-rose-500">Log Out</span>
                        </motion.button>

                        {/* App Info */}
                        <div className="text-center py-6">
                            <p className="text-sm text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.3)]">
                                MessageNode v1.0.0
                            </p>
                            <p className="text-xs mt-1 text-[rgba(0,0,0,0.2)] dark:text-[rgba(255,255,255,0.2)]">
                                Made with ❤️
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

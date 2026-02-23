import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  User,
  Bell,
  MessageCircle,
  Bookmark,
  Settings,
  LogOut,
  PlusSquare,
  TrendingUp,
  Zap,
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/services/api';
import { CreatePostModal } from './CreatePostModal';

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/explore', { state: { query: searchQuery } });
      setSearchQuery('');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: TrendingUp, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Bottom nav only shows these on mobile
  const mobileNavItems = menuItems.slice(0, 5);

  return (
    <>
      {/* ── Desktop / Tablet Sidebar ─────────────────────────────── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="
          fixed left-0 top-0 h-screen z-50 flex-col
          hidden md:flex
          w-20 xl:w-64
          border-r border-border
          bg-background/95
          backdrop-blur-xl
          transition-all duration-300
        "
      >
        {/* Logo */}
        <div className="p-4 xl:p-6 flex items-center gap-3 border-b border-border">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]"
          >
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold text-foreground hidden xl:block whitespace-nowrap tracking-tight">
            Connect
          </span>
        </div>

        {/* Search Bar - Desktop */}
        <div className="px-4 py-4 hidden xl:block">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/50 rounded-xl py-2 pl-10 pr-4 text-sm transition-all outline-none"
            />
          </form>
        </div>

        <div className="px-3 xl:px-4 py-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsPostModalOpen(true)}
            className="
              w-full rounded-xl font-semibold flex items-center justify-center gap-2
              xl:px-4 xl:py-3 p-3
              bg-primary text-primary-foreground hover:shadow-lg transition-all
              text-sm
            "
          >
            <PlusSquare className="w-5 h-5 flex-shrink-0" />
            <span className="hidden xl:inline">Create Post</span>
          </motion.button>
        </div>

        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
        />

        {/* Navigation */}
        <nav className="flex-1 px-2 xl:px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`
                    flex items-center gap-3 rounded-xl transition-all relative
                    justify-center xl:justify-start
                    px-3 py-3 xl:px-4
                    ${isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                    />
                  )}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 font-medium text-sm hidden xl:inline">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full hidden xl:flex items-center bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 xl:p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 xl:p-3 rounded-xl cursor-pointer transition-all hover:bg-muted group">
            <div className="relative flex-shrink-0">
              <img
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                alt={user?.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-primary/20"
              />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-green-500"
              />
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="text-sm font-semibold text-foreground/90 truncate">{user?.name}</p>
              <p className="text-xs truncate text-muted-foreground">
                @{user?.email?.split('@')[0]}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hidden xl:flex text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="
          fixed bottom-0 left-0 right-0 z-50
          flex md:hidden
          items-center justify-around
          px-2 py-2
          safe-bottom
          bg-background/95 backdrop-blur-xl border-t border-border
        "
      >
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all"
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  {item.badge && item.badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-rose-500 text-white"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-all ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="h-0.5 w-4 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Logout on mobile */}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center gap-1 py-1 px-2 group"
        >
          <LogOut className="w-6 h-6 text-rose-500/60 group-hover:text-rose-500 transition-colors" />
          <span className="text-[10px] font-medium text-rose-500/50 group-hover:text-rose-500/80 transition-colors">
            Exit
          </span>
        </button>
      </motion.nav>
    </>
  );
}
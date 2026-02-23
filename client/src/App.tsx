import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import { Loader2 } from 'lucide-react'
import Bookmarks from '@/pages/Bookmarks'
import Notifications from '@/pages/Notifications'
import Messages from '@/pages/Messages'
import Explore from '@/pages/Explore'
import Settings from '@/pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const bgStyle = isDarkMode ? { background: '#060b14' } : { background: '#f8fafc' }
  const loaderColor = isDarkMode ? '#00e5ff' : '#6366f1'
  const textColor = isDarkMode ? 'rgba(0,229,255,0.5)' : 'rgba(99,102,241,0.5)'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: loaderColor }} />
          <p className="text-sm font-medium" style={{ color: textColor }}>Initializing...</p>
        </motion.div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const bgStyle = isDarkMode ? { background: '#060b14' } : { background: '#f8fafc' }
  const loaderColor = isDarkMode ? '#00e5ff' : '#6366f1'
  const textColor = isDarkMode ? 'rgba(0,229,255,0.5)' : 'rgba(99,102,241,0.5)'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: loaderColor }} />
          <p className="text-sm font-medium" style={{ color: textColor }}>Initializing...</p>
        </motion.div>
      </div>
    )
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id?"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <Bookmarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App

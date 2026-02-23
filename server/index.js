const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const storiesRoutes = require('./routes/stories');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const auth = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io and onlineUsers available globally so routes can emit events
global.io = io;
global.onlineUsers = new Map(); // userId -> socketId

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User comes online
  socket.on('user_online', (userId) => {
    global.onlineUsers.set(userId, socket.id);
    // Broadcast updated online list
    io.emit('online_users', Array.from(global.onlineUsers.keys()));
    console.log(`User ${userId} is online`);
  });

  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user_typing', { userId, conversationId });
  });

  socket.on('stop_typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user_stop_typing', { userId, conversationId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove from online users map
    for (const [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        global.onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online_users', Array.from(global.onlineUsers.keys()));
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', onlineUsers: global.onlineUsers.size }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

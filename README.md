# MessageNode — Premium Social Media Experience

MessageNode is a full-featured social media platform built with the MERN stack (MongoDB, Express, React, Node.js). It features a **premium, Dribbble-inspired UI** with a vibrant blue theme, smooth animations, and optimized performance for a seamless social experience.

## 🌐 Live Demo

**Live App:** [https://messagenode-c5q9.onrender.com](https://messagenode-c5q9.onrender.com) (Frontend & Backend)

**Test Endpoints:**
- **Health Check:** [https://messagenode-c5q9.onrender.com/api/health](https://messagenode-c5q9.onrender.com/api/health)
- **Get Posts:** [https://messagenode-c5q9.onrender.com/api/posts](https://messagenode-c5q9.onrender.com/api/posts)

> ⚠️ **Note:** Free tier spins down after inactivity. First request may take 50 seconds to wake up.

---

## 🚀 Key Features

### 🎨 Premium UI & Experience
- **Vibrant Blue Aesthetic**: A modern design system centered around deep blues and soft, premium aesthetics.
- **Advanced Layout**: 40px rounded corners (2.5rem), glassmorphism effects, and professional typography.
- **Smooth Animations**: High-quality transitions using Framer Motion.
- **Full Responsiveness**: Seamless experience across mobile, tablet, and desktop.

### 📱 Social & Messaging
- **Real-Time Messaging**: Instant chatting powered by Socket.io with typing indicators.
- **Disappearing Stories**: 24-hour expiration system for temporary photo updates.
- **Dynamic Feed**: Like, comment, and interact with posts in real-time.
- **Global Discovery**: Search for users worldwide with detailed social follow/following metrics.
- **Live Trending**: Real-time hashtags pulled from global trends with deep links to trend trackers.

### ⚡ Performance & Scale
- **Backend Pagination**: Efficient data fetching using `page` and `limit` parameters to handle thousands of posts.
- **Database Indexing**: Optimized MongoDB sorting via `createdAt` indices for near-instant feed loading.
- **Infinite Scroll**: A "bottomless" home feed using high-performance `IntersectionObserver`.
- **Optimistic Updates**: Perceived zero-latency interactions for likes and comments.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Socket.io-client (Real-time updates)

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose (Atlas)
- Socket.io (Real-time engine)
- JWT + Bcryptjs (Secure Authentication)
- Multer (File Uploads)

---

## 📋 Prerequisites

- Node.js (v20 or higher)
- MongoDB Atlas account
- npm or yarn

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aryannotsopro/MessageNode.git
   cd MessageNode
   ```

2. **Configure Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file:
   # MONGODB_URI=your_mongodb_connection_string
   # JWT_SECRET=your_secret_key
   # PORT=3000
   npm run dev
   ```

3. **Configure Frontend:**
   ```bash
   cd ../client
   npm install
   # Create a .env file:
   # VITE_API_URL=http://localhost:3000/api
   npm run dev
   ```

---

## 📁 Project Structure

```text
MessageNode/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Home, Profile, Explore, etc.
│   │   └── services/    # API calls with Axios
├── server/              # Node.js backend (Express)
│   ├── models/          # Post, Story, User, Notification
│   ├── routes/          # API endpoint logic
│   └── middleware/      # Auth and Upload handling
└── README.md
```

---

## 🔐 Security Features
- **Password Hashing**: Secure encryption with bcrypt (12 salt rounds).
- **JWT Auth**: Token-based authentication for stateful sessions.
- **Protected Routes**: Middleware-driven access control.
- **Input Validation**: Request sanitization using express-validator.

---

## 🧪 Testing
Use Postman or any API testing tool to test the endpoints. Import the collection or manually test using the documentation above.

---

## 👨‍💻 Author
**Aryan Chourasia**

- **GitHub**: [@aryannotsopro](https://github.com/aryannotsopro)
- **LinkedIn**: [Aryan Chourasia](https://www.linkedin.com/in/aryanchourasia/)
- **Email**: aryanc19444@gmail.com

---

## 📝 License
This project is open source and available under the **MIT License**.

Built with ❤️ to demonstrate modern full-stack engineering and advanced UI design.
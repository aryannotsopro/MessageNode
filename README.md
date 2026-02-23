# 🚀 MessageNode — Premium Social Experience

![MessageNode UI](file:///C:/Users/aryan/.gemini/antigravity/brain/9e908e04-2302-4104-8a24-0656036dc8c3/home_page_premium_ui_1771834597561.png)

MessageNode is a high-performance, full-stack social media application designed with a **premium Dribbble-inspired aesthetic**. It features a vibrant blue theme, smooth animations, and advanced social discovery tools, all built on a robust MERN stack architecture.

## 🌐 Live Deployment

- **Hosted App:** [https://messagenode-c5q9.onrender.com](https://messagenode-c5q9.onrender.com)
- **API Status:** [https://messagenode-c5q9.onrender.com/api/health](https://messagenode-c5q9.onrender.com/api/health)

---

## ✨ Premium Features

### 🎨 Visual Excellence
- **Vibrant Blue Aesthetic:** A curated color palette (`#2C55E9`) designed for a modern, professional look.
- **Advanced UI/UX:** Glassmorphism effects, smooth Framer Motion animations, and a consistent 40px rounded-corner design system.
- **Dynamic Theming:** Deep support for both light and dark modes with high-contrast elements.

### 📱 Social Discovery
- **High-Impact Stories:** 24-hour disappearing stories with a premium circular viewing experience.
- **Global Search:** Instant user discovery via the sidebar with detailed social metrics.
- **Live Trending:** Real-time hashtags updated from global social pulses, integrated with external trend trackers.
- **Deep-Link Messaging:** Seamless transition from profiles and search results directly into real-time conversations.

### ⚡ Performance & Scale
- **Optimized Feed:** Infinite scrolling with `IntersectionObserver` for a "bottomless" feel without load delays.
- **Backend Pagination:** High-efficiency data fetching with paginated API endpoints.
- **Database Indexing:** Optimized MongoDB sorting via `createdAt` indices for near-instant feed updates.
- **Optimistic UI:** Instant feedback on likes and comments for zero-latency user interaction.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for ultra-fast builds
- **Tailwind CSS** & **Shadcn UI**
- **Framer Motion** for premium animations
- **Lucide React** for consistent iconography
- **Socket.io-client** for real-time interactivity

### Backend
- **Node.js** & **Express 5**
- **MongoDB** with **Mongoose ODM**
- **Socket.io** for real-time communication
- **JWT & Bcryptjs** for secure authentication
- **Multer** for high-performance image handling

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB Atlas account

### 1. Clone & Install
```bash
git clone https://github.com/aryannotsopro/MessageNode.git
cd MessageNode
```

### 2. Backend Setup
```bash
cd server
npm install
# Create a .env file with:
# PORT=3000
# JWT_SECRET=your_secret
# MONGODB_URI=your_mongo_url
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
# Create a .env file with:
# VITE_API_URL=http://localhost:3000/api
npm run dev
```

---

## 📁 Project Structure

```text
MessageNode/
├── client/          # Vite + React Frontend
│   ├── src/         # UI Components, Pages, and Services
│   └── public/      # Static Assets
├── server/          # Node + Express Backend
│   ├── models/      # Mongoose Schemas (Post, Story, User, etc.)
│   ├── routes/      # RESTful API Endpoints
│   └── uploads/     # Local Image Storage
└── README.md
```

---

## 👨‍💻 Author

**Aryan Chourasia**
- GitHub: [@aryannotsopro](https://github.com/aryannotsopro)
- LinkedIn: [Aryan Chourasia](https://www.linkedin.com/in/aryanchourasia/)
- Email: [aryanc19444@gmail.com](mailto:aryanc19444@gmail.com)

---

## 📝 License
This project is open-source and available under the **MIT License**.
Built with ❤️ to demonstrate the intersection of advanced design and scalable architecture.
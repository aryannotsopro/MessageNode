
# MessageNode - Social Media REST API

A full-featured social media REST API built with Node.js, Express, and MongoDB. Features include user authentication, posts with likes/comments, user profiles, and pagination.

## 🚀 Features

- **User Authentication** - Secure signup/login with JWT and bcrypt password hashing
- **Post Management** - Create, read, update, delete posts with authorization
- **Likes System** - Like/unlike posts with duplicate prevention
- **Comments** - Add and delete comments on posts
- **User Profiles** - View and update user profiles with post history
- **Pagination** - Efficient data fetching with customizable page size
- **Input Validation** - Request validation using express-validator
- **MongoDB Atlas** - Cloud database with Mongoose ODM

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- express-validator

## 📋 Prerequisites

- Node.js (v20 or higher)
- MongoDB Atlas account
- npm or yarn

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/aryannotsopro/MessageNode.git
cd MessageNode
Install dependencies:

bash
cd server
npm install
Create .env file in server/ folder:

text
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
PORT=3000
Start the server:

bash
npm run dev
Server will run on http://localhost:3000

📚 API Documentation
Authentication
Signup
text
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
Login
text
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
Response:

json
{
  "token": "jwt_token_here",
  "userId": "user_id_here"
}
Posts
Get All Posts (with pagination)
text
GET /api/posts?page=1&limit=10
Get My Posts
text
GET /api/posts/me
Authorization: Bearer {token}
Create Post
text
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Post Title",
  "content": "Post content here",
  "imageUrl": "https://example.com/image.jpg"
}
Update Post
text
PUT /api/posts/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "imageUrl": "https://example.com/image.jpg"
}
Delete Post
text
DELETE /api/posts/:id
Authorization: Bearer {token}
Likes
Like a Post
text
POST /api/posts/:id/like
Authorization: Bearer {token}
Unlike a Post
text
DELETE /api/posts/:id/like
Authorization: Bearer {token}
Comments
Get Comments
text
GET /api/posts/:id/comments
Add Comment
text
POST /api/posts/:id/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Great post!"
}
Delete Comment
text
DELETE /api/posts/:postId/comments/:commentId
Authorization: Bearer {token}
User Profiles
Get My Profile
text
GET /api/users/me/profile
Authorization: Bearer {token}
Update My Profile
text
PUT /api/users/me/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "New status message"
}
View User Profile
text
GET /api/users/:id
📁 Project Structure
text
MessageNode/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── index.js
│   ├── .env
│   └── package.json
└── README.md
🔐 Security Features
Password hashing with bcrypt (12 salt rounds)

JWT-based authentication

Protected routes with middleware

Input validation and sanitization

Password excluded from API responses

🧪 Testing
Use Postman or any API testing tool to test the endpoints. Import the collection or manually test using the documentation above.

👨‍💻 Author
Aryan Chourasia

GitHub: @aryannotsopro
(https://github.com/aryannotsopro)

LinkedIn: Aryan Chourasia
(https://www.linkedin.com/in/aryanchourasia/)

Email: aryanc19444@gmail.com

📝 License
This project is open source and available under the MIT License.

🙏 Acknowledgments
Built as a learning project to demonstrate RESTful API design

Inspired by social media platforms like Twitter/Instagram
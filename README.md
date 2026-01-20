# 🎮 VylloGames - Game Ads Platform

A pixel-retro styled game advertising platform inspired by Kairosoft, with a React frontend and Express/MongoDB backend. Features a secure super admin dashboard for managing game advertisements.

## ✨ Features

### Public Site
- 🎮 Pixel-retro Kairosoft-style design
- 🏠 Game showcase homepage with featured games
- 🆕 New releases section
- 📄 Game detail pages with trailers
- 📱 Download links (iOS, Android, Steam, etc.)
- 📐 Fully responsive design

### Admin Dashboard
- 🔐 Super Admin authentication (single admin)
- 🛡️ Maximum security (rate limiting, JWT, session management)
- 📦 Game management (CRUD)
- 🖼️ ImageKit cloud storage for images
- 👁️ Toggle game visibility
- ⭐ Mark games as featured/new
- 🎬 YouTube trailer support

## 📁 Project Structure

```
PlaceHolder/
├── src/                    # React Frontend
│   ├── api/               # API service layer
│   ├── components/        # React components
│   │   ├── Admin/        # Admin dashboard
│   │   ├── GameCard/     # Game card component
│   │   ├── GameDetail/   # Game detail page
│   │   └── HomePage/     # Home page
│   └── context/          # Auth context
│
├── Server/                # Express Backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── middleware/       # Auth middleware
│
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- ImageKit account (free tier available)

### 1. Setup Backend Server

```bash
cd Server
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Super Admin - Generate hash with: node generate-admin-password.js YourPassword!
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=SuperAdmin
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

Generate admin password:
```bash
node generate-admin-password.js "YourSecurePassword123!"
```

Seed sample games (optional):
```bash
npm run seed
```

Start server:
```bash
npm run dev
```

### 2. Setup Frontend

```bash
# From root directory
npm install
npm run dev
```

## 🔐 Admin Access

Access admin panel at: `http://localhost:5173/admin/login`

Use the credentials you set in your `.env` file.

### Security Features
- 🔒 3 login attempts before 30-min lockout
- ⏱️ 10-minute access tokens
- 🔄 1-hour refresh tokens with rotation
- 📴 15-minute inactivity auto-logout
- 🛡️ Rate limiting on all endpoints
- 🧹 NoSQL injection prevention

## 📡 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | Get all active games |
| GET | `/api/games/featured` | Get featured games |
| GET | `/api/games/new` | Get new releases |
| GET | `/api/games/:id` | Get single game |
| GET | `/api/health` | Health check |

### Protected (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games/admin/all` | Get all games |
| POST | `/api/games` | Create game |
| PUT | `/api/games/:id` | Update game |
| DELETE | `/api/games/:id` | Delete game |
| PATCH | `/api/games/:id/toggle-active` | Toggle visibility |
| POST | `/api/upload/image` | Upload image to ImageKit |
| DELETE | `/api/upload/image/:fileId` | Delete image |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify` | Verify token |

## 🛠 Tech Stack

### Frontend
- React 19 + Vite
- React Router DOM
- Axios
- React Hot Toast
- Press Start 2P & VT323 fonts

### Backend
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- ImageKit (cloud storage)
- Helmet, Rate Limiting, HPP
- express-validator

## 🚀 Deployment

### Backend (Railway, Render, etc.)
1. Deploy to Node.js host
2. Set all environment variables
3. Connect to MongoDB Atlas

### Frontend (Vercel, Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set `VITE_API_URL` to production backend

## 📄 License

MIT License - VylloGames © 2026

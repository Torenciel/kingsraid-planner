# King's Raid Planner

A full-stack web application for planning and sharing hero team compositions in the game **King's Raid**. Players can build teams, configure hero loadouts, and browse strategies shared by the community.

**Live:** [kingsraid-planner.com](https://kingsraid-planner.com)

---

## Features

**Team Builder**

- Create teams of variable size (up to 8 heroes)
- Configure each hero's Unique Weapon, Unique Treasure, Artifact, Gear Set, Perks, and Soul Weapon advancement
- Save, edit, and delete teams
- Public/private visibility toggle per team

**Team Browser**

- Browse and search public teams
- Filter by game content: World Bosses, Raids, Guild Conquest, Guild Raids, Trials
- Upvote and bookmark favorite teams

**Authentication**

- Email/password registration with email verification
- Google OAuth login
- JWT-based session management (access + refresh tokens)
- Password reset via email link

**Account**

- Profile page with public team showcase
- Avatar and banner customization
- Preferences for team visibility/profil visibility/color theme

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, React Router 7, Tailwind CSS          |
| Backend  | Node.js, Express 4                              |
| Database | MongoDB (Mongoose 8)                            |
| Auth     | JWT (access + refresh tokens), Google OAuth 2.0 |
| Email    | Resend API                                      |
| Hosting  | Vercel (frontend), Railway (backend)            |

---

## Project Structure

```
kingsraid-planner/
├── frontend/          # React app (port 3000)
│   ├── public/
│   │   └── kingsraid-data/    # Game assets (hero images, artifacts, gear sets, perks)
│   └── src/
│       ├── components/    # UI components (TeamBuilder, TeamSlots, SlotPanel, HeroGrid...)
│       ├── Routes/        # Page components
│       ├── contexts/      # React Context (Auth, Team, Hero, Artifact, GearSet, Perks...)
│       ├── hooks/         # Custom hooks (useApi, useHeroData...)
│       └── services/      # API service wrappers
│
└── backend/           # Express API (port 3002)
    └── src/
        ├── models/        # Mongoose schemas (User, Team, Hero, Artifact, GearSet, Perk)
        ├── routes/        # REST endpoints (/auth, /teams, /heroes, /artifacts...)
        ├── middlewares/   # JWT auth middleware
        ├── services/      # Game data services
        └── utils/         # JWT helpers, mailer, team data converter
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Resend](https://resend.com) account for email (optional for local dev)
- Google OAuth credentials (optional for local dev)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/kingsraid-planner.git
cd kingsraid-planner

# Install all dependencies (root + frontend + backend)
npm run install:all
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
SERVER_PORT=3002
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3002

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kingsraid-planner

# JWT — use strong random strings in production
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="KingsRaid Planner <noreply@yourdomain.com>"

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/google/callback
```

### Running Locally

```bash
# Start both frontend and backend
npm run dev
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:3002 |

### Importing Game Data

The first time you run the app locally, populate the database with game data:

```bash
cd backend
npm run import-all
```

---

## Available Scripts

**Root:**

| Script                | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start frontend + backend concurrently |
| `npm run install:all` | Install all dependencies              |
| `npm run build`       | Build frontend for production         |

**Backend (`/backend`):**

| Script               | Description                       |
| -------------------- | --------------------------------- |
| `npm run dev`        | Start with nodemon (auto-reload)  |
| `npm run import-all` | Import all game data into MongoDB |
| `npm run backup-db`  | Backup the database               |
| `npm run test-mongo` | Test MongoDB connection           |

---

## API Overview

All endpoints are prefixed with `/api/v2`.

| Resource  | Endpoints                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth      | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` |
| OAuth     | `GET /oauth/google`, `GET /oauth/google/callback`                                                                                            |
| Teams     | `GET/POST /teams`, `GET/PATCH/DELETE /teams/:slug`                                                                                           |
| Heroes    | `GET /heroes`                                                                                                                                |
| Artifacts | `GET /artifacts`                                                                                                                             |
| Gear Sets | `GET /gearsets`                                                                                                                              |
| Perks     | `GET /perks`                                                                                                                                 |
| Users     | `GET /users/:id`, `PUT /users/:id`                                                                                                           |
| Support   | `POST /support/feedback`, `/support/bug`, `/support/contact`                                                                                 |

---

## License

This is a fan-made project. King's Raid is owned by MasangGames. All game assets and intellectual property belong to their respective owners. This project is not affiliated with or endorsed by MasangGames.

# King's Raid Planner

> A full-stack team builder and community sharing platform for the game **King's Raid**.
> Build hero compositions, configure loadouts, and browse strategies from other players.

**Live app:** [kingsraid-planner.vercel.app](https://kingsraid-planner.vercel.app)

---

<!-- GIF PLACEHOLDER — record a short screen capture showing: selecting heroes, configuring a loadout, browsing public teams -->
<!-- Suggested tool: ScreenToGif (free, Windows) or LICEcap -->
<!-- Replace this comment with: ![Demo](./demo.gif) -->

---

## Features

**Team Builder**
- Create teams of 4 to 8 heroes
- Configure each hero's Unique Weapon, Unique Treasure, Artifact, Gear Set, Perks (T1/T2/T3/T5), and Soul Weapon advancement
- Save, edit, and delete teams with public/private visibility

**Team Browser**
- Browse and search public teams from the community
- Filter by game content: World Bosses, Raids, Guild Conquest, Guild Raids, Trials
- Upvote and bookmark favorite teams

**Authentication**
- Email/password registration with email verification
- Google OAuth login
- JWT access + refresh token flow stored in HTTP-only cookies
- Password reset via email

**Account**
- Avatar and banner customization
- Preferences for default team visibility and color theme
- Username, email, and password management

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, React Router 7, Tailwind CSS          |
| Backend  | Node.js, Express 4                              |
| Database | MongoDB (Mongoose 8)                            |
| Auth     | JWT (access + refresh tokens), Google OAuth 2.0 |
| Email    | Resend API                                      |
| Testing  | Jest, Supertest (22 backend tests)              |
| CI       | GitHub Actions                                  |
| Hosting  | Vercel (frontend), Railway (backend)            |

---

## Architecture

```
frontend/ (React 19 + Tailwind)   →  Vercel       port 3000
backend/  (Node.js + Express 4)   →  Railway      port 3002
database  (MongoDB Atlas)
```

The frontend communicates with the backend via a REST API (`/api/v2/`) using cookie-based authentication. State is managed through 9 React Contexts covering auth, team data, heroes, artifacts, gear sets, perks, modals, overlays, and slot panels.

---

## Development

<details>
<summary>Run locally</summary>

**Prerequisites:** Node.js 18+, MongoDB instance, Resend API key (optional), Google OAuth credentials (optional)

```bash
git clone https://github.com/Torenciel/kingsraid-planner.git
cd kingsraid-planner
npm run install:all
```

Create `backend/.env` (see `backend/.env.example` for all variables), then:

```bash
npm run dev          # starts frontend (3000) + backend (3002)

cd backend
npm run import-all   # populate DB with game data (first run only)
npm test             # run backend test suite
```

</details>

---

## License

Fan-made project. King's Raid is owned by MasangGames. All game assets belong to their respective owners. Not affiliated with or endorsed by MasangGames.

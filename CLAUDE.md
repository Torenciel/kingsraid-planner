# King's Raid Planner — CLAUDE.md

Full-stack team builder/sharer web app for the game King's Raid. Players create hero team compositions, configure hero loadouts (UW, UT, Artifact, Gear Set, Perks, SW advancement), save teams, and browse public teams from the community.

---

## Commands

```bash
# Root (run from project root)
npm run dev           # Start frontend (port 3000) + backend (port 3002) concurrently
npm run install:all   # Install all dependencies (root + frontend + backend)
npm run build         # Production build (CRA)

# Backend only (from backend/)
npm run dev           # Start with nodemon (auto-reload)
npm run import-all    # Import all game data into MongoDB (run once on fresh DB)
npm run import-heroes / import-artifacts / import-gearsets / import-perks / import-hero-perks
npm run backup-db     # Backup database
npm run test-mongo    # Test MongoDB connection

# Frontend only (from frontend/)
npm start             # Start CRA dev server on port 3000
npm run build         # Production build
```

**Important:** Frontend uses **Create React App** (`react-scripts`), NOT Vite. Despite `vite.config.js` being present, the actual build tool is CRA. Use `npm start` not `npm run dev` in the frontend directory.

---

## Architecture

```
frontend/ (React 19, React Router 7, Tailwind CSS) — port 3000 — Vercel
backend/  (Node.js, Express 4, Mongoose 8)         — port 3002 — Railway
database  MongoDB Atlas
```

**Communication:** All fetch calls use `credentials: "include"` (cookie-based auth). Base URL from `process.env.REACT_APP_API_URL` (defaults to `http://localhost:3002`). API prefix: `/api/v2/`.

**Static assets:** Game images (heroes, artifacts, gear sets) served from `frontend/public/kingsraid-data/assets/`. Paths are stored as relative strings in the DB; frontend constructs full URLs via context helpers (`getArtifactPublicUrl`, etc.).

---

## Authentication

JWT-based, tokens stored in HTTP-only cookies.

- **Access token:** 1 hour, claims: `sub` (userId), `role`, `displayName`
- **Refresh token:** 7 days, claim: `sub` only
- **Auto-refresh:** API service retries 401 once via `POST /api/v2/auth/refresh`. If that fails, user is logged out locally (no redirect — caller must check `isAuthenticated`).
- **Middleware:** `requireAuth` and `optionalAuth` in `backend/src/middlewares/auth.middleware.js`
- **Rate limiting:** 10 req/15 min for login; 10 req/hour for other auth endpoints

---

## Environment Variables

**Backend `backend/.env`:**
```
NODE_ENV, SERVER_PORT, FRONTEND_URL, BACKEND_URL
MONGODB_URI                  # Required
ACCESS_TOKEN_SECRET          # Required — JWT signing
REFRESH_TOKEN_SECRET         # Required — JWT signing
RESEND_API_KEY               # Email service
EMAIL_FROM                   # From address
GOOGLE_CLIENT_ID             # OAuth
GOOGLE_CLIENT_SECRET         # OAuth
GOOGLE_REDIRECT_URI          # http://localhost:3000/oauth/google/callback (dev)
```

**Frontend `frontend/.env.development`:**
```
REACT_APP_API_URL=http://localhost:3002
```

**Frontend `frontend/.env.production`:**
```
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## Data Models (MongoDB/Mongoose)

### User
Fields: `email`, `passwordHash` (select:false — query with `.select("+passwordHash")`), `emailVerified`, `googleId`, `displayName`, `avatar`, `banner`, `role` (user/admin/moderator), `status`, `preferences` (`theme`, `profileVisibility`, `defaultTeamVisibility`), `bookmarkedTeams`, `upvotedTeams`, `stats.teamsCreatedCount`

### Team
Fields: `name`, `slug` (unique, auto-generated as `{name-slugified}-{_id}`), `teamSize` (4–8), `heroes` (array of HeroConfig), `isPublic`, `author` (ref User), `tags`, `views`, `upvotes`, `bookmarks`, `formatVersion` (current: 4)

### HeroConfig (nested in Team.heroes)
```
heroSlug, heroClass, slotPosition (0-indexed)
uw:       { stars: 0-5 }
ut:       { choice: 0-4, stars: 0-5 }
sw:       { advancement: null | 0 | 1 | 2 }
artifact: { artifactSlug, stars: 0-5 }
gearSet:  { isMultiSet, sets: [slug], pieces: 0|2|4 }
perks:    { t1: { selected: [slug] }, t2: { selected: [slug] },
            t3: { s1-s4: "light"|"dark"|null }, t5: "light"|"dark"|null }
```

### Hero
Fields: `slug`, `infos` (name, class, position, thumbnail, etc.), `skills`, `books`, `perks` (t3 map, t5), `uw`, `uts`, `sw`, `releaseOrder`

### Artifact
Fields: `slug`, `name`, `description`, `thumbnail`, `value` (object with keys "0"–"5" for star level descriptions), `releaseOrder`

### GearSet
Fields: `slug`, `name`, `thumbnail`, `bonus2P`, `bonus4P`, `sortOrder`

### Perk
Fields: `slug`, `name`, `description`, `thumbnail`, `tier` (t1/t2/t3/t5), `class`, `heroSlug` (required for t3/t5), `skillIndex` (1-4, required for t3), `type` (light/dark, required for t3/t5)

---

## Frontend State Management (React Contexts)

Context provider order in App.jsx matters — listed outermost to innermost:

| Context | Hook | Manages |
|---|---|---|
| `AuthContext` | `useAuth()` | User session, `isAuthenticated`, login/logout |
| `HeroContext` | `useHeroContext()` | All heroes, filtering, search, `loadHeroDetails(slug)` |
| `ArtifactContext` | `useArtifacts()` | All artifacts, `getArtifactBySlug()`, `getArtifactPublicUrl()` |
| `GearSetContext` | `useGearSets()` | All gear sets, single/multi-set logic |
| `PerksContext` | `usePerks()` | All perks by tier/class/hero, team perk selection |
| `ModalContext` | `useModal()` | Active modal + stack for nested modals, `openModal(type, data)` |
| `OverlayContext` | `useOverlay()` | Hover tooltips for items |
| `TeamContext` | `useTeam()` | Current team being built, saved teams, all CRUD ops |
| `SlotPanelContext` | `useSlotPanel()` | Which sub-slot panel is open (`activeSlot`) |

---

## API Routes (all prefixed `/api/v2`)

| Resource | Methods | Notes |
|---|---|---|
| `/auth/register` | POST | Creates unverified user, sends verification email |
| `/auth/login` | POST | Sets access + refresh cookies |
| `/auth/logout` | POST | Clears cookies |
| `/auth/refresh` | POST | Reissues access token |
| `/auth/verify-email` | POST | Consumes email verification token |
| `/auth/forgot-password` | POST | Sends reset email |
| `/auth/reset-password/:token` | POST | Completes reset |
| `/auth/me` | GET | Current user (auth required) |
| `/heroes` | GET | All heroes; `GET /:slug` for single |
| `/artifacts` | GET | All artifacts; `GET /:slug` for single |
| `/gearsets` | GET | All gear sets; `GET /:slug` for single |
| `/perks` | GET | All perks; `/tier/:tier`, `/hero/:slug`, `/class/:class` |
| `/teams` | GET, POST | List (filters: author, isPublic, tags) / Create |
| `/teams/:identifier` | GET, PATCH, DELETE | Lookup by slug OR ObjectId |
| `/teams/:id/upvote` | POST | Auth required |
| `/teams/:id/bookmark` | POST | Auth required |
| `/users/:username` | GET | Public profile |
| `/users/:id` | PUT | Update profile (auth required) |
| `/oauth/google/callback` | POST | Google OAuth handler |
| `/support/contact` | POST | |
| `/support/feedback` | POST | |
| `/support/bug-report` | POST | |
| `/health` | GET | Server status |

---

## Frontend Routes

**Public:**
`/`, `/login`, `/register`, `/verify-email`, `/verify-pending`, `/forgot-password`, `/reset-password/:token`, `/oauth/google/callback`, `/teams/public`, `/team/:slug`, `/about`, `/privacy-policy`, `/cookie-policy`, `/legal-notice`, `/feedback`, `/bug-report`, `/contact`

**Protected (auth required):**
`/profile`, `/teams/private`, `/team/edit` (create), `/team/edit/:slug` (edit), `/account/username`, `/account/email`, `/account/password`

---

## Key Gotchas & Non-Obvious Details

**Team data conversion:** Frontend and DB use different formats. Always use:
- `teamConverter.convertTeamContextToDB()` — frontend → DB (backend `utils/teamConverter.js`)
- `TeamContext.convertDBToTeamContext()` — DB → frontend (inside `TeamContext.js`)

**T2 perks are index-based:** Stored as column indices (0–4) mapped per class via `T2_MAPPING` table (duplicated in `teamConverter.js` and `TeamContext.js`). The mapping is class-specific — a column index means a different perk slug depending on hero class.

**SW advancement valid values:** Only `null`, `0`, `1`, `2`. Any other value is coerced to `null`. `0` = blue, `1` = purple, `2` = red.

**Multi-set gear sets:** `isMultiSet: true` + `sets: [slug1, slug2]` (max 2). Single sets: `isMultiSet: false` + `sets: [slug]` + `pieces: 0|2|4`. Frontend wraps multi-sets with `set1Info`/`set2Info` for display.

**Slug-based team URLs:** Teams are looked up by slug (`name-{_id}`) for public sharing. The slug is auto-generated on creation and stored in the DB.

**passwordHash is select:false:** When querying users for auth, must explicitly add: `User.findOne({ email }).select("+passwordHash")`.

**Fresh database needs import:** DB starts empty. Run `npm run import-all` in `backend/` before first use. Game data lives in JSON files imported by scripts in `backend/scripts/`.

**Artifact image resolution:** Use `getArtifactBySlug()` + `getArtifactPublicUrl()` from `ArtifactContext` — do NOT convert slugs to filenames manually. The slug-to-filename conversion breaks for artifacts with apostrophes or irregular casing.

**SubSlot overlay flash fix:** `SubSlotOverlay.jsx` returns `null` until `heroDetails` is loaded for UW/UT slots (slots 0 and 1). This prevents a "no data" flash before async data arrives.

**Empty team slots always render:** `TeamSlots.jsx` sorts filled slots by position and appends empty slots after — all `teamSize` slots always render so the grid is visible before any hero is added.

**Google OAuth redirect URI:** Must match exactly in Google Cloud Console AND in `backend/.env`. Dev: `http://localhost:3000/oauth/google/callback`. Prod: `https://kingsraid-planner.vercel.app/oauth/google/callback`.

---

## Project Structure

```
kingsraid-planner/
├── frontend/
│   ├── public/kingsraid-data/     # Game assets (hero images, artifacts, gear sets, perks)
│   └── src/
│       ├── components/
│       │   ├── TeamBuilder/       # Create/edit team UI + SaveTeamButton
│       │   ├── TeamSlots/         # TeamSlots, TeamSlot, CharacterSlot, SubSlot, SubSlotOverlay, PerkPreview
│       │   ├── SlotPanel/         # InlineSlotPanel + item selectors (UW, UT, Artifact, GearSet, Perks)
│       │   ├── HeroGrid/          # Hero selection grid with filters
│       │   ├── Modals/            # ModalManager, TeamSettingsModal, ConfirmationModal, etc.
│       │   ├── Profile/           # Profile page components
│       │   ├── UI/                # Navbar, Footer, layout
│       │   └── Guards/            # ProtectedRoute
│       ├── contexts/              # All React Contexts (see table above)
│       ├── hooks/                 # useApi.js, useHeroData.js, useOverlayTrigger.js
│       ├── services/              # api.js (base fetch wrapper), artifactService.js, imageCacheService.js
│       ├── utils/                 # sortTeamByPosition.js, perkConverter.js, etc.
│       ├── constants/             # tagGroups.js (game content tags/bosses)
│       └── Routes/                # Page components
│
└── backend/
    └── src/
        ├── models/                # Mongoose schemas
        ├── routes/                # Express route handlers
        ├── middlewares/           # auth.middleware.js
        ├── services/              # heroService.js, artifactService.js, gearsetService.js, perkService.js
        ├── utils/                 # jwt.js, mailer.js, teamConverter.js
        └── server.js              # Express app entry point
    └── scripts/                   # Data import/export/verify scripts
```

---

## User Preferences

- User handles all git operations (add, commit, push) themselves — do not run git commands unless explicitly asked.

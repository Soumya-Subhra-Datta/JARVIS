# JARVIS — Personal AI Assistant

<div align="center">
  <p><strong>Your intelligent personal assistant powered by AI. Chat, manage tasks, analyze data, and automate your workflow.</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment-guide">Deployment</a> •
    <a href="#testing-checklist">Testing</a>
  </p>
</div>

## Features

### Core Capabilities
- **AI Chat Assistant** — Natural conversations powered by Cerebras AI API with emotional intelligence
- **Voice Assistant** — Speech-to-text & text-to-speech using Web Speech API with live transcripts
- **Personal Memory System** — JARVIS remembers user preferences, facts, and notes per user
- **Task & Reminder System** — Create, edit, complete, and prioritize tasks with due dates
- **Notes System** — Create, edit, search, and manage notes
- **File Upload & Document Q&A** — Upload TXT, CSV, JSON, PDF, DOCX files and ask AI questions about them
- **CSV Data Analyzer** — Upload CSV files, preview data, detect types, view stats, generate charts, ask AI questions
- **Web Search Assistant** — Optional web search via SerpAPI or Google Custom Search
- **Website Launcher** — Voice/text commands to open websites (YouTube, GitHub, Gmail, etc.)
- **Command System** — Natural language intent parsing (create_note, create_task, search_web, open_website, etc.)
- **Activity Logs** — Track all user actions in a timeline
- **User Settings** — Customize assistant name, personality, voice output, theme, system prompt

### Dashboard
- Futuristic dark-themed UI with animated AI orb (emotional states: idle, listening, thinking, speaking, happy, empathetic, serious, excited)
- Responsive sidebar navigation — full sidebar on desktop, collapsible on tablet, compact on mobile
- Stats overview (chats, tasks, notes, files)
- Protected routes with JWT authentication

### Cross-Platform Support
- **Desktop browsers** — Chrome, Edge, Firefox, Safari
- **Mobile browsers** — Android Chrome, iOS Safari, Samsung Internet
- **PWA** — Installable on Android, iOS, and Desktop (Chrome/Edge)
- **Android APK** — Optional via Capacitor
- **iOS App** — Optional via Capacitor (requires macOS + Xcode)
- **Desktop App** — Optional via PWA or Electron/Tauri

### Security
- Password hashing with bcrypt (12 rounds)
- JWT-based authentication with configurable expiry
- Rate limiting on API routes
- Helmet.js security headers
- CORS configuration for multiple allowed origins
- Parameterized SQL queries (no SQL injection)
- File upload size & type validation
- Input validation with express-validator
- User isolation — no data leakage between users
- All secrets in backend `.env` only, never in frontend

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router 6, Recharts, React Icons, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8+ (via mysql2 with connection pooling) |
| **AI API** | Cerebras API (`gpt-oss-120b`) |
| **Auth** | JWT + bcryptjs |
| **PWA** | Web App Manifest, Service Worker |
| **Mobile (optional)** | Capacitor (Android/iOS) |
| **Desktop (optional)** | PWA install, Electron/Tauri |
| **Deployment** | Vercel/Netlify (frontend), Render (backend), Aiven/PlanetScale (database) |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  React SPA      │────▶│  Express API     │────▶│    MySQL     │
│  (Vite + PWA)   │     │  (Node.js)       │     │  (Cloud DB)  │
│  Desktop/Mobile │     │  ┌─────────────┐ │     └──────────────┘
│  PWA/APK/iOS    │     │  │ Cerebras AI │ │
└─────────────────┘     │  │ Service     │ │
                        │  └─────────────┘ │
                        │  ┌─────────────┐ │
                        │  │ Cmd Parser  │ │
                        │  └─────────────┘ │
                        └──────────────────┘
```

### Data Flow
1. User authenticates via JWT → backend validates credentials against MySQL
2. User sends chat message → backend parses intent (commandParser)
3. Backend assembles context (system prompt + user memories + chat history + file context)
4. Backend calls Cerebras API with assembled context
5. AI response returned with detected emotion → frontend animates orb accordingly
6. Voice responses use browser SpeechSynthesis API

## Folder Structure

```
jarvis/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/            # auth, upload, validate, errorHandler
│   ├── routes/               # Express route definitions
│   ├── controllers/          # Request handlers
│   ├── services/             # cerebrasAI, commandParser, searchService, fileProcessor
│   ├── scripts/setupDb.js    # Database creation & migration script
│   ├── uploads/              # Uploaded file storage
│   ├── server.js             # Entry point
│   ├── render.yaml           # Render deployment config
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   ├── sw.js             # Service worker
│   │   ├── offline.html      # Offline fallback
│   │   ├── icons/            # PWA icons
│   │   └── vite.svg
│   ├── scripts/
│   │   └── generate-icons.js # PNG icon generator
│   ├── src/
│   │   ├── api/api.js        # Axios instance with JWT interceptors
│   │   ├── context/          # AuthContext (React Context API)
│   │   ├── components/       # Layout, Chat, UI, Dashboard, Voice, CSV
│   │   ├── pages/            # Landing, Login, Register, Dashboard, Chat, Voice, Notes, Tasks, Files, CSV, Memory, Settings, Profile, Logs
│   │   ├── index.css         # Global dark theme + responsive styles
│   │   ├── App.jsx           # Route definitions
│   │   └── main.jsx          # Entry point
│   ├── vercel.json
│   ├── netlify.toml
│   ├── capacitor.config.json
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json              # Root scripts
└── README.md
```

## Database

### Tables (10)
| Table | Purpose |
|-------|---------|
| `users` | User accounts (name, email, password hash) |
| `chat_sessions` | Conversation sessions per user |
| `chat_messages` | Individual messages (user/assistant) per session |
| `memories` | User memories/preferences/notes |
| `tasks` | Tasks with priority, due date, status |
| `notes` | User notes with title and content |
| `uploaded_files` | File metadata (name, type, path, size) |
| `csv_datasets` | CSV analysis results (columns, stats, preview) |
| `activity_logs` | User activity audit trail |
| `user_settings` | Per-user assistant configuration |

### Setup
```bash
cd backend
npm install
npm run setup-db
```

This creates the database `jarvis_ai` and all tables. Set `SEED_DEMO=true` in `.env` to insert a demo user (demo@jarvis.ai / demo123456).

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+ (local or cloud)
- Cerebras API key (get at [cloud.cerebras.ai](https://cloud.cerebras.ai))

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd jarvis

# Root (optional, for running both together)
npm install

# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup
```bash
cd backend
npm run setup-db
```

### 3. Environment Variables

**Backend `.env` (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=jarvis_ai

JWT_SECRET=your-long-secure-secret-key
JWT_EXPIRES_IN=7d

CEREBRAS_API_KEY=your-cerebras-api-key
CEREBRAS_MODEL=gpt-oss-120b

CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app

ENABLE_LOCAL_AUTOMATION=false
MAX_FILE_UPLOAD_MB=10

SEARCH_API_KEY=            # Optional
SEARCH_API_PROVIDER=        # serpapi or google
```

**Frontend `.env` (`frontend/.env`) — optional for production:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App opens at `http://localhost:5173`

**Both together (requires root install):**
```bash
npm run dev
```

## PWA Installation

### Android (Chrome)
1. Open the deployed app in Chrome
2. Tap the menu (⋮) → "Add to Home screen"
3. Name: JARVIS → tap "Add"

### iOS (Safari)
1. Open the deployed app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down → "Add to Home Screen"
4. Name: JARVIS → tap "Add"

### Desktop (Chrome/Edge)
1. Open the deployed app
2. Click the install icon in the address bar (or menu → Install JARVIS)
3. The app opens in its own window

## Capacitor Mobile App (Optional)

Build native Android/iOS apps using Capacitor:

### Prerequisites
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Java 17+ (for Android)

### Setup
```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios    # macOS only
```

### Build
```bash
npm run build
npx cap sync
npx cap open android   # Opens Android Studio
npx cap open ios       # Opens Xcode (macOS only)
```

### Build APK
From Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. APK will be at `frontend/android/app/build/outputs/apk/debug/`

### Build IPA (iOS, macOS only)
From Xcode:
1. Product → Archive
2. Distribute App → Development → Export

**Important:** The Capacitor app loads the React frontend and calls the backend API. Backend secrets remain server-side only.

## Desktop App (Optional)

### PWA Install (Recommended)
The easiest way to use JARVIS as a desktop app is to install the PWA (see PWA Installation above). Works on Windows, macOS, Linux, and ChromeOS.

### Electron (Community)
To build an Electron desktop app:
```bash
npx electron-packager frontend/dist JARVIS --platform=win32,darwin,linux --arch=x64
```

### Tauri (Community)
For a smaller desktop build:
```bash
npm install -g @tauri-apps/cli
cd frontend
npx tauri init
npx tauri build
```

## Deployment Guide

### Frontend → Vercel
1. Push code to GitHub
2. Import repo in Vercel
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

### Frontend → Netlify
1. Push code to GitHub
2. Import repo in Netlify
3. Base directory: `frontend`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Environment variables:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
7. Netlify automatically handles SPA routing via `netlify.toml`

### Backend → Render
1. Push code to GitHub
2. Create new Web Service in Render
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Environment variables (set ALL from `.env.example`):
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.netlify.app`
   - All DB, JWT, Cerebras credentials
7. Health check: `GET /health`

### Database → Cloud MySQL

**Option A — Aiven (free tier):**
1. Create account at [aiven.io](https://aiven.io)
2. Create MySQL service (free: 1GB RAM, 5GB storage)
3. Get connection details from dashboard
4. Update backend env vars in Render
5. Run `npm run setup-db` locally pointing to cloud DB

**Option B — Railway MySQL:**
1. Create Railway project → Add MySQL plugin
2. Copy connection details to backend env vars
3. Run migrations from Render shell: `npm run setup-db`

**Option C — Clever Cloud MySQL:**
1. Create account at [clever-cloud.com](https://clever-cloud.com)
2. Create MySQL add-on
3. Use connection URI in backend env vars

## Testing Checklist

### Branding
- [ ] App title shows "JARVIS" everywhere
- [ ] Assistant introduces itself as JARVIS in chat
- [ ] System prompt says "You are JARVIS"
- [ ] No "AURA AI" branding visible in UI

### Desktop (Chrome, Edge, Firefox, Safari)
- [ ] Register new user
- [ ] Login
- [ ] Dashboard loads with stats
- [ ] Send AI chat message
- [ ] Use voice input (if supported)
- [ ] Create task
- [ ] Create note
- [ ] Add memory
- [ ] Upload file
- [ ] Upload CSV and analyze
- [ ] View chat history
- [ ] Open settings
- [ ] Logout

### Android (Chrome)
- [ ] Register and login
- [ ] Dashboard responsive layout
- [ ] Chat works
- [ ] Voice input test
- [ ] Install PWA from Chrome
- [ ] Reopen installed PWA

### iPhone/iPad (Safari)
- [ ] Login works
- [ ] Text chat works
- [ ] Voice fallback shown if unsupported
- [ ] Add to Home Screen
- [ ] PWA respects safe areas

### Tablet (iPad, Android Tablet)
- [ ] Dashboard grid looks correct
- [ ] Sidebar/collapsible navigation works
- [ ] Forms and tables usable

### Deployment
- [ ] Backend health endpoint: `GET /health`
- [ ] Frontend calls deployed backend URL
- [ ] CORS works across origins
- [ ] MySQL cloud connection works
- [ ] No secret keys in frontend build
- [ ] Production build runs without errors

### Responsive Breakpoints
- [ ] 320px (small phone) — no overflow, readable text
- [ ] 375px (iPhone) — buttons tappable, layout stacks
- [ ] 425px (large phone) — chat input visible
- [ ] 768px (iPad portrait) — sidebar collapsible
- [ ] 1024px (iPad landscape) — grid adjusts
- [ ] 1280px (desktop) — full layout
- [ ] 1440px+ (large monitor) — max width constraint

## API Routes

### Authentication
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Logout user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| PUT | `/api/auth/change-password` | Yes | Change password |

### Chat
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat` | Yes | Send message & get AI response |
| GET | `/api/chat/sessions` | Yes | List sessions |
| POST | `/api/chat/sessions` | Yes | Create session |
| GET | `/api/chat/sessions/:id` | Yes | Get session with messages |
| PUT | `/api/chat/sessions/:id` | Yes | Rename session |
| DELETE | `/api/chat/sessions/:id` | Yes | Delete session |

### Other Resources
| Group | Routes |
|-------|--------|
| Memory | GET `/api/memory`, POST `/api/memory`, DELETE `/api/memory/:id` |
| Tasks | GET `/api/tasks`, POST `/api/tasks`, PUT `/api/tasks/:id`, DELETE `/api/tasks/:id` |
| Notes | GET `/api/notes`, POST `/api/notes`, PUT `/api/notes/:id`, DELETE `/api/notes/:id` |
| Files | POST `/api/files/upload`, GET `/api/files`, DELETE `/api/files/:id`, POST `/api/files/:id/ask` |
| CSV | POST `/api/csv/upload`, GET `/api/csv/:id/summary`, POST `/api/csv/:id/ask` |
| Settings | GET `/api/settings`, PUT `/api/settings` |
| Logs | GET `/api/logs` |

## Local PC Automation (Optional)

The Safe PC Automation module is **disabled by default** and only works locally:

```env
ENABLE_LOCAL_AUTOMATION=true
```

When enabled, it can open local applications (VS Code, folders, etc.) via natural language commands. It asks for confirmation before any system-level action. This never works on deployed instances.

## Troubleshooting

### ECONNREFUSED — Database
- Ensure MySQL is running: `mysql -u root -p`
- Check DB_HOST/PORT in `.env`
- For cloud DB, check firewall allows your IP

### Cerebras API Key Not Configured
- Set `CEREBRAS_API_KEY` in backend `.env`
- Get a key at [cloud.cerebras.ai](https://cloud.cerebras.ai)
- Keep it in backend only — never in frontend code

### Module Not Found
- Run `npm install` in both `backend/` and `frontend/`
- Run `npm install` at root level for dev dependencies

### CORS Errors in Production
- Set `ALLOWED_ORIGINS` to include your frontend URL(s)
- Set `CLIENT_URL` to your primary frontend URL
- Both env vars work; `ALLOWED_ORIGINS` supports comma-separated list

### Voice/Microphone Not Working
- **Chrome/Edge**: Allow microphone permission when prompted
- **Firefox**: May require `media.getusermedia.audiocapture.enabled` in about:config
- **Safari**: Web Speech API limited; text chat always available as fallback
- **iOS Safari**: Speech recognition is not supported. Text input works.
- Check that the page is served via HTTPS (required for microphone access)

### Blank Page After Build
- Ensure `VITE_API_BASE_URL` is set correctly
- Check browser console for errors
- Verify build succeeded: `cd frontend && npm run build`

### API Not Connecting from Mobile
- Ensure backend URL is publicly accessible
- Check CORS settings include your mobile device's origin
- For local testing, use your machine's IP address instead of localhost

### PWA Not Installing
- **Android**: Use Chrome, ensure the site is served via HTTPS
- **iOS**: Use Safari, manual "Add to Home Screen" only (no install prompt)
- **Desktop**: Chrome/Edge show install icon in address bar

### iOS Safe Area Issues
- The app uses `env(safe-area-inset-*)` CSS variables
- If layout looks wrong, ensure your iOS version supports safe areas (iOS 11+)

## Security Notes

- **Cerebras API key** is stored only in backend `.env` — never in frontend code or builds
- **JWT secret** is stored only in backend `.env`
- **MySQL credentials** are stored only in backend `.env`
- Frontend only knows the public backend API URL
- All user data is scoped by `user_id` — no cross-user data access
- API routes are protected with JWT middleware
- File uploads are validated by type and size
- Rate limiting prevents abuse
- SQL injection is prevented with parameterized queries
- Helmet.js adds security headers

## Free Resources & Links

### AI API — Cerebras
| Resource | Link |
|----------|------|
| Sign Up (Free Credits) | [https://cloud.cerebras.ai](https://cloud.cerebras.ai) |
| API Documentation | [https://docs.cerebras.ai](https://docs.cerebras.ai) |
| Pricing | Free tier available; pay-as-you-go after |

### Free MySQL Database Hosting
| Platform | Free Tier | Link |
|----------|-----------|------|
| **Aiven** | 1GB RAM, 5GB storage, free forever | [https://aiven.io](https://aiven.io) |
| **Railway** | $5 credit, free MySQL plugin | [https://railway.app](https://railway.app) |
| **Clever Cloud** | 256MB RAM, 50MB storage free tier | [https://clever-cloud.com](https://clever-cloud.com) |
| **PlanetScale** | 1GB storage, 100M row reads/mo | [https://planetscale.com](https://planetscale.com) |
| **TiDB Serverless** | 5GB storage, free forever MySQL-compatible | [https://tidbcloud.com](https://tidbcloud.com) |

### Free Frontend Hosting
| Platform | Free Tier | Link |
|----------|-----------|------|
| **Vercel** | Unlimited sites, automatic SSL, 100GB bandwidth | [https://vercel.com](https://vercel.com) |
| **Netlify** | Unlimited sites, 300 build minutes/mo | [https://netlify.com](https://netlify.com) |
| **Render Static** | 100GB bandwidth, free SSL | [https://render.com](https://render.com) |
| **Cloudflare Pages** | Unlimited sites, 500 builds/mo | [https://pages.cloudflare.com](https://pages.cloudflare.com) |

### Free Backend Hosting
| Platform | Free Tier | Link |
|----------|-----------|------|
| **Render** | 750 hours/mo, 512MB RAM, free SSL | [https://render.com](https://render.com) |
| **Railway** | $5 credit, good for small projects | [https://railway.app](https://railway.app) |
| **Fly.io** | 3 shared VMs, 3GB persistent storage | [https://fly.io](https://fly.io) |
| **Cyclic** | Free tier for Node.js apps | [https://cyclic.sh](https://cyclic.sh) |

### Free Search APIs
| Platform | Free Tier | Link |
|----------|-----------|------|
| **SerpAPI** | 100 searches/mo free | [https://serpapi.com](https://serpapi.com) |
| **Google Custom Search** | 100 queries/day free | [https://programmablesearchengine.google.com](https://programmablesearchengine.google.com) |

### Free PWA Icon Generator
| Tool | Link |
|------|------|
| PWABuilder Icons | [https://www.pwabuilder.com/imageGenerator](https://www.pwabuilder.com/imageGenerator) |
| Favicon Generator | [https://realfavicongenerator.net](https://realfavicongenerator.net) |
| Maskable Icon Editor | [https://maskable.app/editor](https://maskable.app/editor) |

### Free Project Management & Code Hosting
| Platform | Link |
|----------|------|
| **GitHub** (free private repos, Actions, Pages) | [https://github.com](https://github.com) |
| **GitLab** (free CI/CD, container registry) | [https://gitlab.com](https://gitlab.com) |

> **Note:** Always check current pricing before signing up. Free tiers are subject to change.

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Smart home integration (IoT)
- [ ] Calendar & Google Calendar sync
- [ ] Email assistant (send/read emails)
- [ ] Advanced voice wake word ("Hey JARVIS")
- [ ] Local desktop agent (Electron/Tauri)
- [ ] Browser extension (Chrome/Firefox)
- [ ] RAG-based knowledge base with vector DB
- [ ] Multi-agent workflow orchestration
- [ ] Real-time WebSocket voice mode
- [ ] Light theme support
- [ ] Image generation & analysis
- [ ] Multi-language support
- [ ] End-to-end encryption

## License

MIT — Built with ❤️

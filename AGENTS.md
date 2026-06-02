# AGENTS.md

This document is the source of truth for AI agents (Claude, Cursor, Copilot, etc.) working on this codebase. Read it fully before writing or modifying any code.

---

## Project Overview

A full-stack real-time chat and video call platform. The repo is a **monorepo** with three top-level directories:

```
/
├── client/        # Next.js 15 frontend (TypeScript)
├── server/        # Express.js + Socket.IO backend (ESM JavaScript)
├── nginx/         # Nginx reverse proxy config
├── scripts/       # DB seed scripts
└── docker-compose.yml
```

The stack: **Next.js 15 · Express.js · MongoDB · Redis · Socket.IO · WebRTC · Docker**

---

## Architecture

### Request Flow

```
Browser
  │
  └─ Nginx :5173
       ├─ /           → Next.js client :3000   (SSR pages)
       ├─ /api/       → Express server :8000   (REST)
       └─ /socket.io/ → Express server :8000   (WebSocket upgrade)
```

### Multi-instance Socket.IO

The Express server is designed to run as **multiple instances** behind Nginx. Socket.IO events are synchronized across instances using the **Redis Adapter** (`@socket.io/redis-adapter`). Three separate Redis clients are required:

- `redisClient` — general-purpose (GET/SET/HSET/etc.)
- `pubClient` — adapter publisher (must not be used for anything else)
- `subClient` — adapter subscriber (must not be used for anything else)

> **Rule:** Never use `pubClient` or `subClient` for anything other than the Redis Adapter.

### Real-time Layers

| Feature | Mechanism |
|---|---|
| Chat messages | Socket.IO rooms (`conversation_{id}`) |
| Friend events | Socket.IO rooms (`user_{id}`) |
| Presence | Redis Sets + Socket.IO broadcast |
| Video/Audio call signaling | Socket.IO relay (WebRTC SFU-less) |
| Call state persistence | Redis Hash (`active_calls`) |
| Multi-instance event sync | Socket.IO Redis Adapter |

---

## Server — `/server`

### Folder Structure

```
server/
├── index.js                  # Entry point: Express + Socket.IO bootstrap
├── config/
│   ├── cloudinary.config.js  # Cloudinary SDK init
│   └── redis.config.js       # redisClient + pubClient + subClient + clearRedisOnStart
├── controllers/              # HTTP layer — parse req, call service, return res
│   ├── auth.controller.js
│   ├── call.controller.js
│   ├── conversation.controller.js
│   ├── message.controller.js
│   ├── upload.controller.js
│   └── user.controller.js
├── database/
│   └── connectMongoDB.js     # Mongoose connection
├── helpers/
│   ├── auth.helper.js        # Password hash/compare
│   ├── jwt.helper.js         # sign/verify access & refresh tokens
│   └── upload.helper.js      # Cloudinary upload/delete helpers
├── middlewares/
│   ├── auth.middleware.js    # checkAuth (HTTP) + socketAuth (Socket.IO)
│   ├── errorHandler.middleware.js
│   └── multer.middleware.js  # Memory storage for uploads
├── models/
│   ├── user.model.js
│   ├── conservation.model.js # Note: filename is "conservation" not "conversation"
│   ├── message.model.js
│   ├── friendShip.model.js
│   └── index.js              # Re-exports all models
├── routes/
│   ├── auth.route.js         # /api/auth
│   ├── user.route.js         # /api/users
│   ├── conversation.route.js # /api/conversations
│   ├── message.route.js      # /api/messages
│   ├── upload.route.js       # /api/uploads
│   ├── call.route.js         # /api/calls
│   └── index.js              # Re-exports all routers
├── services/                 # Business logic — DB queries, Redis ops, side effects
│   ├── auth.service.js
│   ├── call.service.js       # processCallEnd, handleCallCleanup, rejectCall, endCall
│   ├── conversation.service.js
│   ├── message.service.js
│   ├── user.service.js
│   └── index.js
├── sockets/
│   ├── index.js              # initSocket — Redis Adapter, presence, socketAuth middleware
│   ├── chat.handler.js       # join/leave room, message delivery, typing, friend events
│   └── webrtc.handler.js     # offer, answer, ICE candidate, call state in Redis
└── utils/
    ├── constant.util.js      # CACHE_USER_PREFIX and other constants
    ├── env.util.js           # ENV validation/export
    ├── filter.util.js
    └── mailer.util.js        # Nodemailer send helpers
```

### Conventions

**Layer responsibilities — do not cross these:**

- `routes/` — only define routes and attach middleware. No logic.
- `controllers/` — parse `req`, call one or more services, format and return `res`. No direct DB access.
- `services/` — all business logic, DB queries, Redis operations, external API calls. No `req`/`res`.
- `helpers/` — pure utility functions (no side effects, no DB). Reused by services.
- `middlewares/` — request guards and transformers only.
- `sockets/` — Socket.IO event handlers. Call services for any business logic.

**Module system:** ESM (`import`/`export`) throughout. No `require()`.

**Error handling:** Throw errors in services. Controllers catch and respond. Global `errorHandler` middleware is the last resort.

**Auth in sockets:** `socketAuth` middleware verifies JWT from cookie or `socket.handshake.auth.token`. It populates `socket.userId` and `socket.user`. Every socket handler reads user identity from these — never from event payload.

**Redis key conventions:**

```
online_users              → Set  — all currently online userIds
online_user:{userId}      → Set  — socketIds for that user (multi-tab)
active_calls              → Hash — userId → JSON call metadata
call_end_lock:{callerId}:{startTime} → String — short-lived lock for terminal call-message dedupe
{CACHE_USER_PREFIX}{id}   → String — cached user profile JSON
```

---

## Client — `/client`

### Folder Structure

```
client/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, providers)
│   ├── globals.css              # Design tokens + Tailwind theme
│   ├── loading.tsx              # Root loading UI
│   ├── auth/
│   │   ├── layout.tsx           # Auth layout (no sidebar)
│   │   └── page.tsx             # Login / Register page
│   └── (main)/
│       ├── layout.tsx           # Main app layout (Sidebar + socket init)
│       ├── page.tsx             # Chat page (conversation list + window)
│       └── contacts/page.tsx    # Contacts & friend management
├── components/
│   ├── auth/                    # AuthForm, AuthLeft, ForgotPasswordForm, GoogleButton
│   ├── call/                    # VideoCall, ConnectingScreen, EndedScreen, IncomingCallPopup
│   ├── chat/
│   │   ├── Bubble/              # BubbleText, BubbleImages, BubbleFiles
│   │   ├── RightPanel/          # Accordion, SharedMediaAccordion, MembersAccordion, GroupHeader
│   │   ├── ChatWindow.tsx       # Main chat view
│   │   ├── ChatInput.tsx        # Message input + file upload
│   │   ├── MessageBubble.tsx    # Bubble wrapper (own/other, reply, reactions)
│   │   ├── ConversationList.tsx # Left panel list
│   │   └── ...
│   ├── contacts/                # ContactList, ContactDetail, AddFriendModal, RequestCard, SearchBar
│   ├── layout/                  # Sidebar, ProfileModal, SettingsPopover
│   ├── loadings/                # Skeleton components, IconLoading
│   └── providers/               # AuthProvider, QueryProvider
├── hooks/
│   ├── handlers/                # Socket event handlers (one file per domain)
│   │   ├── useCallHandlers.ts   # call:incoming, call:ended, webrtc:answer, webrtc:ice_candidate
│   │   ├── useChatHandlers.ts   # receive_message, message:delivered, typing events
│   │   ├── useFriendHandlers.ts # friend:request_received, friend:accepted, friend:rejected
│   │   ├── useGroupHandlers.ts  # group membership events
│   │   └── usePresenceHandlers.ts # presence:online, presence:offline, presence:online_users
│   ├── useSocketMain.ts         # Socket connection lifecycle (connect, disconnect, reconnect)
│   ├── useSocketEvents.ts       # Registers all handler hooks
│   ├── useWebRTC.ts             # RTCPeerConnection lifecycle, offer/answer/ICE
│   ├── useTyping.ts             # Typing indicator debounce + emit
│   ├── useChatScroll.tsx        # Auto-scroll to bottom logic
│   ├── useDebounce.ts           # Generic debounce hook
│   ├── useAudioFeedback.ts      # Ringtone / call sounds
│   ├── useRingCountDown.ts      # 30s ring timeout
│   └── useAxiosPrivate.ts       # Axios instance with refresh token interceptor
├── store/                       # Zustand stores (one per domain)
│   ├── auth.store.ts            # currentUser, isAuthenticated
│   ├── call.store.ts            # status, callType, streams, role, peerUser
│   ├── conversation.store.ts    # conversations[], activeConversationId
│   ├── message.store.ts         # messages{}, optimistic updates
│   ├── friend.store.ts          # friends[], pendingRequests[]
│   ├── presence.store.ts        # onlineUserIds Set
│   ├── socket.store.ts          # socket instance
│   └── index.ts                 # Re-exports all stores
├── API/                         # Raw Axios functions — pure HTTP, no logic
│   ├── axiosIntance.ts          # Base Axios instance (withCredentials, baseURL)
│   ├── auth.api.ts
│   ├── conversation.api.ts
│   ├── message.api.ts
│   ├── user.api.ts
│   ├── call.api.ts
│   ├── upload.api.ts
│   └── useAPI.ts                # TanStack Query wrappers
├── services/                    # Client-side service layer — orchestrate API + store updates
│   ├── auth.service.ts
│   ├── call.service.ts
│   ├── conversation.service.ts
│   ├── message.service.ts
│   ├── user.service.ts
│   └── index.ts
├── types/
│   └── index.ts                 # All shared TypeScript interfaces (User, Message, Conversation, etc.)
├── utils/
│   ├── call.utils.ts            # Format call duration, call status labels
│   ├── chat.utils.tsx           # Message grouping, timestamp formatting
│   └── user.utils.ts            # Avatar fallback, display name helpers
└── context/
    └── MyContext.tsx            # React context (use sparingly — prefer Zustand)
```

### Conventions

**Data flow:**

```
User action
  → Component calls service (client/services/)
  → Service calls API (client/API/) and updates Zustand store
  → Component reads from store via selector
```

Never call `API/` directly from a component. Always go through `services/`.

**Socket events:**

```
Socket event arrives
  → Handler hook (hooks/handlers/) processes it
  → Updates the relevant Zustand store
  → Component re-renders automatically
```

All socket event registration happens in `useSocketEvents.ts`. Do not register socket listeners inside components.

**Stores — one per domain.** Do not put multiple unrelated concerns in one store. When reading from a store in a component, use `useShallow` for object selectors to prevent unnecessary re-renders:

```typescript
// ✅ Correct
const { status, callType } = useCallStore(useShallow(s => ({ status: s.status, callType: s.callType })));

// ❌ Wrong — re-renders on any store change
const store = useCallStore();
```

**Types:** All shared interfaces live in `client/types/index.ts`. Do not define types inline in components or hooks. Do not duplicate type definitions.

**`useWebRTC` hook:** Owns the `RTCPeerConnection` lifecycle via a `useRef`. The `iceCandidateQueue` ref buffers ICE candidates that arrive before the remote description is set. Do not create `RTCPeerConnection` anywhere else.

---

## Design System

### Fonts

* {
  font-family: "Inter", sans-serif !important;
}

.title {
  font-family: "Barlow Condensed", sans-serif !important;
}

.subtitle {
  font-family: "Poppins", sans-serif !important;
}

.money {
  font-family: "Outfit" !important;
}

### Color Tokens (defined in `globals.css` `@theme`)

**Brand**

| Token | Value | Usage |
|---|---|---|
| `--color-brand` | `#0068ff` | Primary action buttons, links |
| `--color-brand-hover` | `#0057d9` | Hover state for brand elements |
| `--color-brand-muted` | `#c2d9ff` | Brand tints, selected states |
| `--color-primary` | `#2b2bee` | Alt primary (navigation accent) |

**Dark surfaces (main app theme)**

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#0f0f1a` | App root background |
| `--color-surface` | `#181829` | Cards, panels |
| `--color-dark-secondary` | `#191a2e` | Secondary panels |
| `--color-dark-gray` | `#1c2232` | Input backgrounds |
| `--color-gray` | `#282839` | Dividers, borders |

**Light surfaces (modals, popovers)**

| Token | Value | Usage |
|---|---|---|
| `--color-s2` | `#f5f6f8` | Light backgrounds |
| `--color-s3` | `#eceef2` | Subtle separators |
| `--color-s4` | `#dde0e8` | Borders on light surfaces |

**Text**

| Token | Value | Usage |
|---|---|---|
| `--color-ink` | `#0d0e14` | Primary text on light bg |
| `--color-ink-2` | `#3d3f4a` | Secondary text |
| `--color-ink-3` | `#6b6e7c` | Placeholder, muted |
| `--color-ink-4` | `#a0a4b2` | Disabled text |

**Status**

| Token | Value | Usage |
|---|---|---|
| `--color-online` | `#22c55e` | Online presence dot |
| `--color-danger` | `#ef4444` | Errors, destructive actions |
| `--color-warning` | `#f59e0b` | Warnings |

**Shadows**

| Token | Usage |
|---|---|
| `--shadow-xs` | Micro elements (avatars, badges) |
| `--shadow-sm` | Inputs, small cards |
| `--shadow-md` | Dropdowns, tooltips |
| `--shadow-lg` | Modals, sheets |
| `--shadow-sidebar` | Sidebar right edge |

### UI Rules

- The app is **dark-first**. Default new components against dark surfaces (`--color-background`, `--color-surface`).
- Use Tailwind CSS utility classes. CSS-in-JS is not used.
- DaisyUI is available as a Tailwind plugin — use its components (`btn`, `modal`, `badge`, etc.) where appropriate, but override with token-based colors.
- Animations: `fadeUp` (entrance from below) and `fadeIn` (opacity only) keyframes are defined in `globals.css`. Prefer these over custom keyframes.
- Do not hardcode hex colors in component files. Always use token variables (`text-brand`, `bg-surface`, etc.) or Tailwind classes that map to tokens.
- **Icon library:** `lucide-react` — use exclusively for icons.
- **Toast notifications:** `react-hot-toast` — use for all success/error feedback. Do not build custom toast.

---

## Key Patterns to Follow

### Adding a New Socket Event (Server)

1. Add the handler inside the appropriate file in `server/sockets/` (`chat.handler.js` for chat/social, `webrtc.handler.js` for call).
2. Use `io.to(room).emit(...)` — never `socket.broadcast.emit(...)` for user-targeted events (won't work across instances without room).
3. If the event requires a DB write, call a service function — no direct model access in socket handlers.

### Adding a New Socket Event (Client)

1. Add the listener in the appropriate handler hook under `hooks/handlers/`.
2. The handler should update the relevant Zustand store.
3. Register the new hook in `useSocketEvents.ts`.
4. Do not add socket listeners directly in components.

### Adding a New API Route (Server)

1. Create/update service in `services/`.
2. Create/update controller in `controllers/` — one function per endpoint.
3. Add route in `routes/` with appropriate `checkAuth` middleware.
4. Export from `routes/index.js`.

### Adding a New API Call (Client)

1. Add the raw Axios function in the matching `API/` file.
2. If it needs reactive caching, add a TanStack Query wrapper in `API/useAPI.ts`.
3. Add the orchestration logic (API call + store update) in `services/`.
4. Call from component via the service, not directly from the API layer.

---

## Environment Variables

**Server** (all required unless marked optional):

```
PORT                  # Server port (default 8000)
MONGODB_URI           # MongoDB connection string
REDIS_HOST            # Redis host
REDIS_PORT            # Redis port
REDIS_PASSWORD        # Redis password (optional for local)
ACCESS_TOKEN_SECRET   # JWT access token secret
REFRESH_TOKEN_SECRET  # JWT refresh token secret
ACCESS_TOKEN_EXPIRES  # e.g. "15m"
REFRESH_TOKEN_EXPIRES # e.g. "7d"
CLIENT_URL            # CORS origin (e.g. http://localhost:5173)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
MAIL_USER             # Nodemailer SMTP user
MAIL_PASS             # Nodemailer SMTP password
```

**Client** (build-time, must be prefixed `NEXT_PUBLIC_`):

```
NEXT_PUBLIC_API_URL         # e.g. http://localhost:5173/api
NEXT_PUBLIC_SOCKET_URL      # e.g. http://localhost:5173
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

---

## Common Mistakes to Avoid

- **Do not** use `socket.broadcast.emit()` for delivering events to a specific user — use `io.to('user_{userId}').emit()` to work across Redis Adapter instances.
- **Do not** subscribe to or publish on `pubClient`/`subClient` directly — they are reserved for the Redis Adapter.
- **Do not** access `req`/`res` inside service files.
- **Do not** write DB queries in controllers.
- **Do not** register socket event listeners inside React components — always use dedicated handler hooks.
- **Do not** call `API/` files directly from components — always go through `services/`.
- **Do not** define new TypeScript types inline in component files — add them to `types/index.ts`.
- **Do not** hardcode color hex values in components — use Tailwind tokens from the theme.
- **Note the typo:** the model file is `conservation.model.js` (not `conversation`) — do not rename it as it will break existing imports.

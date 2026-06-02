# 💬 Realtime Chat & Video Call Platform

A full-stack, production-ready real-time communication platform supporting instant messaging, peer-to-peer video/audio calls, group chats, and social features — built with a modern architecture and fully containerized for deployment.

---

## ✨ Features

### Messaging
- Real-time 1-on-1 and group conversations via WebSocket
- Support for text, images, files, mixed-media messages
- Message delivery status tracking (sent → delivered)
- Typing indicators with debounce
- Cursor-based infinite scroll pagination for message history

### Video & Audio Calls
- Peer-to-peer video and audio calls using **WebRTC**
- Incoming call notification with ring countdown
- Real-time media state sync (mute/camera toggle visible to peer)
- Missed call detection — automatically logged as a chat message
- STUN/TURN server support for cross-network connectivity
- Graceful call cleanup on disconnect (handled via Redis + Socket.IO)

### Group Chat
- Create, edit, and delete group conversations
- Role-based membership: `owner`, `admin`, `member`
- Add/remove members, transfer ownership
- Shared media & documents panel per conversation

### Social / Contacts
- Friend request system (send, accept, reject, unfriend)
- Real-time friend request notifications
- User search and contact management

### Authentication
- Email/password login with OTP email verification
- **Google OAuth 2.0** single sign-on
- Stateless JWT access token + rotating refresh token
- Session expiry dialog with silent token refresh (Axios interceptor)
- Password reset via email

### Presence
- Real-time online/offline status broadcast
- `lastActive` timestamp stored on disconnect
- Multi-tab/device support — user only goes offline when all sockets disconnect

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Nginx (port 5173)               │
│          Reverse Proxy + WebSocket Upgrade        │
└──────────┬─────────────────────┬────────────────┘
           │                     │
   ┌───────▼──────┐     ┌────────▼────────┐
   │  Next.js 16  │     │  Express.js 5   │
   │  (Client)    │     │  (REST API +    │
   │  Port 3000   │     │  Socket.IO)     │
   └──────────────┘     │  Port 8000      │
                        └────────┬────────┘
                                 │
               ┌─────────────────┼──────────────────┐
               │                 │                  │
       ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
       │   MongoDB 7  │  │  Redis 7     │  │  Cloudinary  │
       │  (Primary DB)│  │(Pub/Sub +    │  │ (File/Image  │
       └──────────────┘  │  Cache +     │  │  Storage)    │
                         │  Presence)   │  └──────────────┘
                         └──────────────┘
```

All services are orchestrated with **Docker Compose** and communicate over an isolated `chat-network` bridge.

---

## 🔧 Technical Highlights

### WebRTC Peer-to-Peer Calls
The signaling layer is built on Socket.IO. The client-side `useWebRTC` hook manages the full call lifecycle:

- **ICE candidate queuing** — candidates arriving before `setRemoteDescription` completes are buffered and flushed atomically to prevent race conditions.
- **Duplicate ICE filtering** — a `Set`-based deduplication layer discards redundant candidates.
- **Graceful media fallback** — if the camera is unavailable, the call continues with audio only; errors surface descriptive user-facing messages (`NotAllowedError`, `NotFoundError`).
- **TURN relay support** — configurable via environment variables for mobile/cross-NAT scenarios (`NEXT_PUBLIC_TURN_URLS`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL`).

### Redis — Multi-Role Usage
Redis serves three distinct purposes:

| Role | Implementation |
|------|---------------|
| **Socket.IO Adapter** | `@socket.io/redis-adapter` with separate `pubClient`/`subClient` — enables horizontal scaling across multiple server instances |
| **Presence Store** | `online_users` Set + per-user `online_user:{id}` Set tracks socket counts for accurate multi-tab detection |
| **Active Call Registry** | `active_calls` Hash maps `userId → callMetadata` for both participants; enables busy detection, missed-call logging, and disconnect-triggered cleanup |
| **User Profile Cache** | TTL-based cache (`CACHE_USER_PREFIX`) avoids redundant DB lookups on every socket event |

### JWT Authentication Flow
- Short-lived **access token** stored in an HttpOnly cookie; attached to requests automatically.
- **Refresh token** rotation — each refresh issues a new token and invalidates the previous.
- Axios instance with a **401 interceptor** that silently refreshes and retries the original request; a `SessionExpiredDialog` is shown only on repeated failure.

### Cursor-Based Pagination
Conversation and message lists use a composite cursor `(lastMessageAt, _id)` for stable, O(log n) pagination. MongoDB compound indexes on `(participants.user, lastMessageAt)` and `(conversation, _id)` ensure sub-millisecond query performance at scale.

### Optimistic UI Updates
Messages are added to the Zustand store immediately with a `tempId` before the server confirms delivery. On server acknowledgement, the temp entry is reconciled with the real `_id`, keeping perceived latency near zero.

### Pending Call Recovery
When a callee reconnects (e.g., page refresh during an incoming call), the server re-emits the pending `call:incoming` event via two mechanisms: a `client:ready` signal from the client, and a 300 ms server-side fallback timeout — preventing missed calls due to slow hydration.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **UI** | Tailwind CSS v4, DaisyUI v5, Lucide Icons |
| **State Management** | Zustand v5 |
| **Data Fetching** | TanStack Query v5, Axios |
| **Backend** | Node.js, Express.js v5 (ESM) |
| **Real-time** | Socket.IO v4 |
| **Video/Audio** | WebRTC (browser-native) |
| **Database** | MongoDB 7 + Mongoose |
| **Cache / Pub-Sub** | Redis 7 |
| **Auth** | JWT, Google OAuth 2.0 (`google-auth-library`) |
| **File Storage** | Cloudinary |
| **Email** | Nodemailer |
| **Infrastructure** | Docker, Docker Compose, Nginx |

---

## 📁 Project Structure

```
.
├── client/                     # Next.js frontend
│   ├── app/                    # App Router pages (auth, chat, contacts)
│   ├── components/             # UI components (call, chat, contacts, layout)
│   │   ├── call/               # VideoCall, IncomingCallPopup, screens
│   │   ├── chat/               # ChatWindow, MessageBubble, RightPanel
│   │   └── auth/               # AuthForm, GoogleButton, ForgotPassword
│   ├── hooks/                  # Custom hooks (useWebRTC, useSocketMain, handlers)
│   ├── store/                  # Zustand stores (auth, call, conversation, message, presence)
│   ├── services/               # API service layer
│   └── API/                    # Axios instances and endpoint definitions
│
├── server/                     # Express.js backend
│   ├── sockets/                # Socket.IO handlers (chat, WebRTC, presence)
│   ├── controllers/            # HTTP controllers
│   ├── services/               # Business logic
│   ├── models/                 # Mongoose schemas
│   ├── middlewares/            # Auth, error handling, file upload
│   └── config/                 # Redis, Cloudinary configuration
│
├── nginx/nginx.conf            # Reverse proxy + WebSocket routing
├── docker-compose.yml          # Full-stack orchestration
└── scripts/init-mongo.js       # DB seed data
```

---

## 🚀 Quick Start (Docker)

**Prerequisites:** Docker & Docker Compose

```bash
# 1. Clone and configure environment
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, CLOUDINARY_*, EMAIL_* credentials

# 2. Build and start all services
docker-compose up -d --build

# 3. Verify containers are running
docker ps

# 4. Open the app
# http://localhost:5173
```

To stop: `docker-compose down -v`

---

## 🔌 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `ACCESS_TOKEN_SECRET_KEY` | JWT signing secret (access) |
| `REFRESH_TOKEN_SECRET_KEY` | JWT signing secret (refresh) |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `CLOUDINARY_*` | Cloudinary API credentials |
| `EMAIL_USERNAME` / `EMAIL_APP_PASSWORD` | SMTP credentials for verification emails |
| `NEXT_PUBLIC_TURN_URLS` | Optional TURN server URLs for WebRTC relay |

---

## 📐 Data Models

### Message
Supports rich content via `type` enum (`text`, `image`, `video`, `file`, `audio`, `system`, `mixed`), structured `attachments`, emoji `reactions`, `replyTo` reference, delivery status, and soft-delete (`deletedFor[]`, `deletedForEveryone`).

### Conversation
Polymorphic schema handles both `direct` and `group` types. Participants carry embedded `role`, `joinedAt`, `lastRead`, and `unreadCount`. Conversations support hiding per-user without deletion.

### Friendship
Dedicated `FriendShip` model decoupled from User, enabling clean friend request lifecycle management (pending → accepted / rejected).
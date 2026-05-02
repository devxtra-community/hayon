# 🔔 NOTIFICATIONS MASTERCLASS
## The Complete Engineering Guide — Hayon Project

---

## TABLE OF CONTENTS

1. [The Big Picture — What Even Is a "Notification"?](#1-the-big-picture)
2. [The Notification Stack in Hayon](#2-the-notification-stack)
3. [How HTTP Falls Short — Why We Need Real-Time](#3-why-http-falls-short)
4. [WebSockets — The Protocol](#4-websockets-the-protocol)
5. [Socket.IO — WebSockets With Superpowers](#5-socketio)
6. [Firebase Cloud Messaging (FCM) — Push Notifications](#6-firebase-fcm)
7. [The Two Firebase SDKs: Admin vs Client](#7-two-firebase-sdks)
8. [Backend: The Notification Data Model](#8-notification-model)
9. [Backend: The Repository Layer](#9-notification-repository)
10. [Backend: Socket.IO Config — `config/socket.ts`](#10-socket-config)
11. [Backend: app.ts — Wiring Everything Together](#11-app-ts)
12. [Backend: Firebase Admin Setup — `config/firebase.ts`](#12-firebase-admin)
13. [Backend: The Service Layer — `notification.service.ts`](#13-notification-service)
14. [Backend: Firebase Controller — `firebase.controller.ts`](#14-firebase-controller)
15. [Backend: The Routes](#15-routes)
16. [Frontend: Firebase Client — `lib/firebase.ts`](#16-firebase-client)
17. [Frontend: Socket Context — `SocketContext.tsx`](#17-socket-context)
18. [Frontend: The Hook — `useNotifications.ts`](#18-usenotifications)
19. [Frontend: The UI — `NotificationDropdown.tsx`](#19-notification-dropdown)
20. [Environment Variables: Where Everything Comes From](#20-env-variables)
21. [Firebase Console: Every Step You Did](#21-firebase-console)
22. [The Full Journey: From Event to Bell Icon](#22-full-journey)
23. [What's Incomplete / Can Be Improved](#23-improvements)

---

## 1. The Big Picture

A notification system has **three fundamental jobs**:

| Job | Mechanism | When |
|---|---|---|
| Tell the user *right now* while they're online | WebSocket / Socket.IO | Instant — milliseconds |
| Tell the user *even when they've closed the browser tab* | Push Notification (FCM) | Anytime, even offline |
| Let the user *revisit* old notifications | Database + REST API | On demand |

Hayon does **all three simultaneously**.

```
Admin approves post
       │
       ▼
NotificationService.createNotification()
       │
       ├──── 1. Save to MongoDB  ──────► User reads history later via REST API
       │
       ├──── 2. Socket.IO emit  ───────► Bell icon updates in real-time (if online)
       │
       └──── 3. FCM push  ─────────────► Browser/device notification (even offline)
```

---

## 2. The Notification Stack in Hayon

| Layer | Technology | File |
|---|---|---|
| Real-time protocol | Socket.IO (over WebSocket) | `config/socket.ts` |
| Push notifications | Firebase Cloud Messaging | `config/firebase.ts` |
| Persistence | MongoDB + Mongoose | `models/notification.model.ts` |
| Data access | Repository pattern | `repositories/notifications.repository.ts` |
| Business logic | Service layer | `services/notification.service.ts` |
| HTTP API | Express routes + controller | `routes/notification.routes.ts`, `controllers/notification.controller.ts` |
| FCM token management | Firebase controller | `controllers/firebase.controller.ts` |
| Frontend connection | React Context | `context/SocketContext.tsx` |
| Frontend state | Custom hook | `hooks/useNotifications.ts` |
| Frontend UI | React component | `components/NotificationDropdown.tsx` |
| Firebase client SDK | Firebase JS SDK | `lib/firebase.ts` |

---

## 3. Why HTTP Falls Short — The Polling Problem

### The Normal HTTP Request-Response Cycle

```
Browser          Server
  │──── GET /notifications ────►│
  │◄─── 200 OK [data] ──────────│
```

HTTP is **stateless** and **unidirectional**. The server can ONLY respond — it cannot initiate. So how would the server tell you about a new notification when it happens?

**Option A: Polling (Bad)**
```
every 5 seconds:
  browser → GET /notifications → server
```
- Hammers the server with useless requests
- Still delayed by up to 5 seconds
- Wastes bandwidth, CPU, and money

**Option B: Long Polling (Better, still ugly)**
```
Browser: "Hey, respond only when something new happens"
Server: ... holds connection open for 30s ...
Server: "OK now something happened" → responds
Browser: immediately opens another long-poll connection
```
- Better latency, but still overhead per connection
- Hard to scale

**Option C: WebSockets (The Right Way)**
```
Browser ──── Upgrade: websocket ────► Server
Browser ◄═══════ persistent tunnel ══════════► Server
           (both sides can send at any time)
```

---

## 4. WebSockets — The Protocol

### The Handshake

WebSocket starts as an HTTP request with a special header:

```
GET /socket HTTP/1.1
Host: dev.hayon.site:5000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

The server responds:
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`101 Switching Protocols` = "OK, we're no longer doing HTTP. We're now in WebSocket mode."

After this handshake, the TCP connection stays open. Both client and server can send **frames** at any time. No more request-response cycle.

### WebSocket Frames

Data is sent in frames, not HTTP bodies. Each frame has:
- Opcode (is this text? binary? ping? close?)
- Payload length
- Masking key (client → server messages are always masked for security)
- Actual data

### Raw WebSocket vs Socket.IO

| Feature | Raw WebSocket | Socket.IO |
|---|---|---|
| Auto-reconnect | ❌ You write it | ✅ Built-in |
| Named events | ❌ Just message strings | ✅ `emit("notification", data)` |
| Rooms / namespaces | ❌ You write it | ✅ Built-in |
| Fallback (polling) | ❌ | ✅ Falls back to polling if WS fails |
| Heartbeat / ping-pong | ❌ You write it | ✅ Built-in |
| Middleware | ❌ | ✅ `io.use((socket, next) => ...)` |

Hayon uses **Socket.IO** because of rooms (each user is in their own room = their userId).

---

## 5. Socket.IO — WebSockets With Superpowers

### Core Concepts

**Server** (`socket.io` npm package):
```typescript
import { Server } from "socket.io";
const io = new Server(httpServer);
```

**Client** (`socket.io-client` npm package):
```typescript
import { io } from "socket.io-client";
const socket = io("https://api.example.com");
```

### Rooms

A **room** is a named channel. A socket can join multiple rooms. When you emit to a room, all sockets in that room receive it.

```typescript
socket.join("room-name");          // join a room
io.to("room-name").emit("event");  // emit to everyone in room
```

In Hayon:
- Each user joins a room named after **their own userId**
- When a notification is created for `recipientId`, we emit to `io.to(recipientId)`
- Only that user's browser receives it

### Namespaces

A namespace is a communication channel that allows you to split the logic over a single shared connection. We don't use namespaces in Hayon (using the default `/` namespace).

### Socket.IO Middleware

```typescript
io.use((socket, next) => {
  // This runs before any connection is established
  // next() = allow connection
  // next(new Error()) = reject connection
});
```

This is how we authenticate: check the JWT from `socket.handshake.auth.token` before letting the user join.

---

## 6. Firebase Cloud Messaging (FCM) — Push Notifications

### What Problem Does FCM Solve?

Socket.IO = great when browser tab is **open**.
FCM = works even when browser tab is **closed**.

When a user closes your app but a post gets approved, how do you notify them? The browser is still running (as a background process on the OS) and can receive **web push notifications** even if no tab is open.

### The Architecture

```
Your Backend (Node.js)
        │
        │  POST to Google's FCM API
        │  (using firebase-admin SDK)
        ▼
   Google FCM Servers
        │
        │  Push delivery
        ▼
   User's Browser / Device
        │
        │  Service Worker receives it
        ▼
   OS-level notification popup
```

### The Token: The Device Address

FCM identifies each browser/device with a unique **FCM token** (also called registration token). Think of it like a phone number for that specific browser on that specific device.

- Changes when: user clears site data, reinstalls browser, token expires
- Multiple tokens per user = user logged in on multiple devices/browsers
- This is why `fcmTokens` in the user model is an **array** `[String]`

### How Your Browser Gets Registered

1. User opens Hayon
2. Browser asks: "Can we send you notifications?" 
3. User clicks "Allow"
4. Firebase SDK generates a unique FCM token for this browser
5. Frontend sends this token to your backend via `POST /api/firebase/save-token`
6. Backend saves it to `user.fcmTokens[]` in MongoDB
7. Later when a notification fires, backend sends to ALL tokens for that user

### VAPID Key

`NEXT_PUBLIC_VAPID_KEY` is the **Voluntary Application Server Identification** key. This is part of the **Web Push Protocol** (RFC 8292). It proves to the browser that the push message came from *your* server, not some attacker. FCM uses this to authorize your backend to send messages to browsers subscribed to your app.

---

## 7. The Two Firebase SDKs

This is a common confusion point. There are **two completely different Firebase SDKs**:

| | Firebase Admin SDK | Firebase Client SDK |
|---|---|---|
| Used in | Backend (Node.js) | Frontend (Browser) |
| Package | `firebase-admin` | `firebase` |
| Auth | Service Account JSON (private key) | Firebase web config (public keys) |
| Powers | Sending messages, managing users | Receiving token, subscribing |
| Your file | `backend/src/config/firebase.ts` | `frontend/src/lib/firebase.ts` |

**Admin SDK**: Authenticated with a **private service account** that has God-mode access. Used to SEND push notifications via `admin.messaging().sendEachForMulticast()`.

**Client SDK**: Used in the browser to get the FCM token via `getToken(messaging, { vapidKey })`. This token is then handed to your backend to store.

---

## 8. The Notification Data Model

**File**: `backend/src/models/notification.model.ts`

```typescript
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: "info" | "warning" | "success" | "error";
  message: string;
  read: boolean;
  image?: string;
  link?: string;
  relatedResource?: {
    type: "post" | "login";
    id: mongoose.Types.ObjectId;
    model: "Post" | "RefreshToken";
  };
  createdAt: Date;
}
```

### Line-by-Line Schema Explanation

```typescript
import mongoose, { Schema, Document } from "mongoose";
```
- `Schema` = the blueprint class for defining a MongoDB document shape
- `Document` = Mongoose's base interface for MongoDB documents (adds `_id`, `save()`, etc.)

```typescript
recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
```
- `Schema.Types.ObjectId` = a 12-byte MongoDB identifier (not a plain string)
- `ref: "User"` = tells Mongoose "when you `.populate()` this field, look in the `User` collection"
- `required: true` = a notification without a recipient makes no sense

```typescript
type: {
  type: String,
  enum: ["info", "warning", "success", "error"],
  default: "info",
},
```
- `enum` = MongoDB-level constraint. Mongo will reject any value not in this list
- These four types map to the icon shown in the frontend (info=blue, warning=yellow, success=green, error=red)

```typescript
read: { type: Boolean, default: false },
```
- Every notification starts unread. The pulsing red dot on the bell uses this.

```typescript
image?: string;
link?: string;
```
- `image` = optional S3 URL of the post's media (shown as thumbnail in the dropdown)
- `link` = optional URL to navigate to when the notification is clicked

```typescript
relatedResource: {
  type: { type: String, enum: ["post", "login"] },
  id: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "relatedResource.model",  // ← dynamic populate!
  },
  model: {
    type: String,
    required: true,
    enum: ["Post", "RefreshToken"],
  },
},
```
- `refPath` = **dynamic population**. Instead of hardcoding `ref: "Post"`, we look at the `model` field at runtime to know which collection to populate from. This single notification schema can link to EITHER a `Post` OR a `RefreshToken` document.

```typescript
{ timestamps: true }
```
- Mongoose automatically adds `createdAt` and `updatedAt` fields
- `createdAt` is used in the frontend: `formatDistanceToNow(new Date(notification.createdAt))`

---

## 9. The Notification Repository

**File**: `backend/src/repositories/notifications.repository.ts`

```typescript
export class NotificationRepository {
  static async create(data: Partial<INotification>) {
    return Notification.create(data);
  }
```
- `Notification.create(data)` = inserts one document into MongoDB and returns the saved document with `_id` and timestamps populated
- `Partial<INotification>` = we don't need to provide ALL fields — some have defaults (`read: false`)

```typescript
  static async findByUserId(userId: string, limit: number, skip: number) {
    return Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("relatedResource.id");
  }
```
- `find({ recipient: userId })` = query: only get notifications belonging to this user
- `.sort({ createdAt: -1 })` = `-1` = descending = newest first
- `.skip(skip)` = pagination: skip the first N results
- `.limit(limit)` = at most return N results
- `.populate("relatedResource.id")` = replace the ObjectId stored in `relatedResource.id` with the full document from the referenced collection (Post or RefreshToken). This is how the frontend can read `notification.relatedResource.id?.content?.mediaItems?.[0]?.s3Url` — after populate, `.id` is the actual Post object, not just an ObjectId.

```typescript
  static async countByUserId(userId: string) {
    return Notification.countDocuments({ recipient: userId });
  }
```
- `countDocuments` = optimized count query. Does NOT fetch all documents — just returns the number
- Used to calculate total pages for pagination

```typescript
  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true },
    );
  }
```
- We query by BOTH `_id` AND `recipient` (the userId). Why? **Security.** Without the `recipient` check, any user could mark any other user's notification as read by guessing an ObjectId.
- `{ new: true }` = return the updated document, not the old one

```typescript
  static async markAllAsRead(userId: string) {
    return Notification.updateMany({ recipient: userId, read: false }, { read: true });
  }
```
- `updateMany` = update all matching documents in one database roundtrip (efficient)
- `read: false` filter = only update unread ones (no-op on already-read notifications)

---

## 10. Socket.IO Config — `config/socket.ts`

Full file, line by line:

```typescript
import { Server, Socket } from "socket.io";
```
- `Server` = the Socket.IO server class. You wrap your HTTP server with this.
- `Socket` = represents one individual client connection. Each browser tab = one Socket.

```typescript
import { Server as HttpServer } from "http";
```
- We alias it `HttpServer` to avoid name collision with Socket.IO's `Server`. Both are called `Server` in their respective packages.

```typescript
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import logger from "../utils/logger";
```
- We import JWT to **verify tokens** inside Socket.IO middleware
- This is authentication on the WebSocket layer — same logic as HTTP middleware but for sockets

```typescript
interface AuthTokenPayload {
  id: string;
  role: string;
}
```
- TypeScript tells us what shape the decoded JWT has. We know our JWTs contain `id` and `role`.

```typescript
export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [ENV.APP.FRONTEND_URL, "localhost:3000"],
      credentials: true,
    },
  });
```
- `new Server(httpServer, ...)` = Socket.IO **attaches itself to the existing HTTP server**. It does NOT create a new port. Both HTTP (Express) and WebSocket traffic go through the same port (5000). The HTTP upgrade mechanism distinguishes WebSocket connections.
- `cors` = Socket.IO has its own CORS layer separate from Express's CORS. Yes, you need to configure it twice — one for HTTP, one for WebSocket.
- `credentials: true` = allow cookies to be sent (needed for authentication)

```typescript
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
```
- `io.use(...)` = **global middleware** that runs for EVERY connection attempt before `io.on("connection")` fires
- `socket.handshake` = the HTTP handshake data from the initial upgrade request
- `socket.handshake.auth` = a special object from Socket.IO's client where you can pass auth data. On the frontend: `io(url, { auth: { token } })`
- This is NOT a cookie or header — it's a Socket.IO-specific auth object sent during connection negotiation

```typescript
    if (!token) {
      return next(new Error("Authentication error"));
    }
```
- `next(new Error(...))` = **reject this connection**. The client will get a `connect_error` event. No connection is established.
- `return next(null)` or just `next()` = allow the connection

```typescript
    try {
      const decoded = jwt.verify(token, ENV.AUTH.ACCESS_TOKEN_SECRET) as AuthTokenPayload;
      socket.data.user = decoded;
      return next();
    } catch (err) {
      logger.error("Authentication error", err);
      return next(new Error("Authentication error"));
    }
```
- `jwt.verify(token, secret)` = cryptographically validates the token and decodes it. Throws if expired or tampered.
- `socket.data.user = decoded` = **attaches data to the socket object** for use later. `socket.data` is a per-socket store — safe to add arbitrary properties here.
- `as AuthTokenPayload` = TypeScript cast — we're telling TS "trust us, this is the right shape"

```typescript
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      logger.info(`User connected to socket: ${userId}`);
      socket.join(userId);
    }
```
- `io.on("connection", ...)` = fires for every successfully authenticated connection (middleware already passed)
- `socket.data.user?.id` = reads the user data we attached in middleware. Optional chain `?.` guards against impossible case where middleware didn't set it.
- `socket.join(userId)` = **this is the magic line**. The socket joins a room named after the userId. Later, `io.to(recipientId).emit("notification", data)` === "emit to the room named recipientId" === "emit to all browser tabs this user has open"

```typescript
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};
```
- `socket.on("disconnect")` = fires when this tab closes, network drops, or user explicitly disconnects
- We return `io` so `app.ts` can export it globally: `export let io: any;`

---

## 11. app.ts — Wiring Everything Together

```typescript
export let io: any;
```
**Line 46.** This is a global mutable variable. It starts as `undefined`. It gets assigned when the server starts. Why export it? So `notification.service.ts` can import it:
```typescript
import { io } from "../app";
```
This is a **circular-import-friendly** pattern: the service doesn't import from socket config, it imports the already-initialized `io` from `app.ts`.

```typescript
if (ENV.APP.NODE_ENV === "production") {
  const httpServer = createServer(expressInstance);
  httpServer.listen(ENV.APP.PORT, () => {
    io = initSocket(httpServer);
  });
} else {
  const httpsServer = https.createServer(options, expressInstance);
  httpsServer.listen(ENV.APP.PORT, () => {
    io = initSocket(httpsServer);
  });
}
```
- Production = plain HTTP (because Nginx/load balancer handles SSL termination)
- Development = HTTPS directly (using your `dev.hayon.site` SSL certs from mkcert)
- `initSocket` is called **inside the `.listen()` callback** — this guarantees the server is actually listening before Socket.IO attaches. If you called it before `.listen()`, Socket.IO would attach to a server that hasn't started yet.
- `io = initSocket(...)` — this is where the global `io` gets its value.

---

## 12. Firebase Admin Setup — `config/firebase.ts`

```typescript
import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
```

**Line 1**: `firebase-admin` is the **server-side** Firebase SDK. It has elevated privileges.

**Line 2**: `serviceAccountKey.json` is downloaded from Google Cloud. It contains:
- `type: "service_account"` — Google knows this is a machine, not a human
- `project_id: "hayon-app"` — which Firebase project
- `private_key_id` — ID of the private key used for signing
- `private_key` — the actual RSA private key (BEGIN PRIVATE KEY). This is what Google uses to VERIFY that push notification requests are from you.
- `client_email` — the service account's email (like a username): `firebase-adminsdk-fbsvc@hayon-app.iam.gserviceaccount.com`
- Various OAuth/token URLs

**Line 4-6**: `admin.initializeApp({ credential: admin.credential.cert(...) })` — initializes the Firebase Admin SDK with service account credentials. This must be called ONCE before any `admin.messaging()` calls. It authenticates against Google's servers using the private key.

**Line 8**: `export default admin` — we export the initialized admin object so it can be imported in `notification.service.ts`.

> ⚠️ **IMPORTANT**: `serviceAccountKey.json` is in your `.gitignore`. It contains a private key — if this leaks, someone can send push notifications as Hayon to all your users. Never commit it.

---

## 13. The Service Layer — `notification.service.ts`

This is the **brain** of the notification system. Every notification in the app goes through this one function.

```typescript
import { INotification } from "../models/notification.model";
import mongoose from "mongoose";
import { io } from "../app";
import { NotificationRepository } from "../repositories/notifications.repository";
import admin from "../config/firebase";
import User from "../models/user.model";
```

- `import { io } from "../app"` — imports the initialized Socket.IO server instance. At the time this module is imported, `io` may still be `undefined` (before `.listen()` fires). The `if (io)` check on line 42 guards this.
- `import admin from "../config/firebase"` — the initialized Firebase Admin SDK

### `createNotification()` — The Main Method

```typescript
static async createNotification(
  recipientId: string,
  message: string,
  type: INotification["type"] = "info",
  relatedResource?: {
    type: "post" | "login";
    id: string | mongoose.Types.ObjectId;
    model: "Post" | "RefreshToken";
  },
  options?: {
    image?: string;
    link?: string;
  },
)
```
- `recipientId: string` — MongoDB ObjectId as string (of the user who will receive it)
- `INotification["type"]` — TypeScript utility type. Instead of rewriting `"info" | "warning" | "success" | "error"`, we reference the existing type on the interface. If the interface changes, this auto-updates.
- `= "info"` — default parameter: if caller doesn't pass a type, it defaults to info
- `relatedResource?` — the `?` means optional. Destructured with nested types inline.
- `options?` — optional bag of extra fields (image URL and link)

```typescript
const notificationData: Partial<INotification> = {
  recipient: new mongoose.Types.ObjectId(recipientId),
  message,
  type,
  image: options?.image,
  link: options?.link,
  relatedResource: relatedResource
    ? {
        ...relatedResource,
        id: new mongoose.Types.ObjectId(relatedResource.id),
      }
    : undefined,
};
```
- `Partial<INotification>` — TypeScript allows leaving fields undefined (since some have defaults in the schema)
- `new mongoose.Types.ObjectId(recipientId)` — converts string `"65a3b..."` to MongoDB ObjectId type. Mongoose can often handle strings, but being explicit is correct.
- `options?.image` — optional chaining: if `options` is undefined, this returns `undefined` instead of throwing
- The `relatedResource` ternary: if we have a relatedResource, spread its properties but **override** the `id` with a freshly cast ObjectId. If not provided, store `undefined`.

```typescript
const notification = await NotificationRepository.create(notificationData);
```
- Delegates to repository. Repository calls `Notification.create()` → MongoDB insert → returns saved document with `_id` and timestamps.

```typescript
if (io) {
  io.to(recipientId).emit("notification", notification);
}
```
- `if (io)` — guards against the edge case where the socket server hasn't started yet (very unlikely in practice, but defensive)
- `io.to(recipientId)` — selects the room named after the user's ID (remember: in `socket.ts`, we did `socket.join(userId)`)
- `.emit("notification", notification)` — sends the event named `"notification"` with the full notification document as payload to ALL sockets in that room (all browser tabs the user has open)
- On the frontend, `socket.on("notification", handleNotification)` catches this

```typescript
const title =
  type === "success"
    ? "Hayon - Your post has been approved "
    : type === "error"
      ? "Hayon - Your post has been rejected"
      : "Hayon - New Notification";
await this.sendPushNotification(recipientId, message, title, options?.image, options?.link);
```
- Constructs a human-friendly OS notification title based on the type
- Calls the push notification method with the resolved title

### `sendPushNotification()` — The FCM Method

```typescript
const user = await User.findById(recipientId).select("fcmTokens");
```
- Direct Model access (not through repository) — this is intentional: it's a lightweight read inside the same service
- `.select("fcmTokens")` — only fetch the `fcmTokens` field, not the entire user document. Efficient.

```typescript
if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
  return;
}
```
- Three failure conditions, all short-circuit:
  1. User doesn't exist
  2. `fcmTokens` field is null/undefined (shouldn't happen given default `[]`, but defensive)
  3. Array is empty (user never granted notification permission or cleared site data)

```typescript
const messagePayload: any = {
  notification: {
    title,
    body: message,
  },
  tokens: user.fcmTokens,
};
```
- This is the FCM **MulticastMessage** shape
- `notification.title` and `notification.body` = what appears in the OS notification popup
- `tokens` = array of FCM tokens — send to ALL of this user's devices simultaneously

```typescript
if (image) {
  messagePayload.notification.image = image;
}
if (link) {
  messagePayload.webpush = {
    fcm_options: {
      link,
    },
  };
}
```
- `notification.image` = URL of image to show in the push notification (only on supported browsers)
- `webpush.fcm_options.link` = when user clicks the OS notification, open this URL. This is a **Web Push specific** option — only applies to FCM messages targeting web browsers (not mobile apps which use different options).

```typescript
const response = await admin.messaging().sendEachForMulticast(messagePayload);
```
- `admin.messaging()` = returns the Firebase Messaging instance
- `.sendEachForMulticast(messagePayload)` = sends the message to each token individually (even though it looks like one call). Why individually? So we can get per-token success/failure.
- Returns a `BatchResponse` with `responses[]` array (one per token) and `failureCount`

```typescript
if (response.failureCount > 0) {
  const failedTokens: string[] = [];
  response.responses.forEach((resp: any, idx: number) => {
    if (!resp.success) {
      failedTokens.push(user.fcmTokens[idx]);
    }
  });
  if (failedTokens.length > 0) {
    await User.updateOne(
      { _id: recipientId },
      { $pull: { fcmTokens: { $in: failedTokens } } },
    );
  }
}
```
- We iterate the responses. `idx` maps 1:1 with `user.fcmTokens` (same order)
- If a token failed, we collect it in `failedTokens`
- `$pull: { fcmTokens: { $in: failedTokens } }` = MongoDB atomic array operation: remove all elements from the `fcmTokens` array that appear in `failedTokens`
- Why? Because failed tokens usually mean the token is **stale** — user cleared browser data, uninstalled, or the token expired. Keeping them wastes FCM API calls.

---

## 14. Firebase Controller — `firebase.controller.ts`

### `saveToken`

```typescript
export const saveToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = req.auth?.id;
```
- `token` from `req.body` = the FCM registration token sent by the frontend after the user grants notification permission
- `req.auth?.id` = set by the `authenticate` middleware from the passport JWT strategy

```typescript
  await updateUser(userId, token);
```

This calls the repository function:
```typescript
export const updateUser = async (userId: string, token: string) => {
  return User.findByIdAndUpdate(userId, { $push: { fcmTokens: token } });
};
```
- `$push` = MongoDB atomic operator: appends `token` to the `fcmTokens` array without loading the whole document
- This means if the same user opens Hayon on 3 devices, they'll have 3 tokens → they get push notifications on all 3

### `getToken`

```typescript
export const getToken = async (req: Request, res: Response) => {
  const user = await findUserByIdSafe(userId);
  return new SuccessResponse("Token fetched successfully", { data: user.fcmTokens }).send(res);
};
```
- Returns the stored FCM tokens for the logged-in user
- `findUserByIdSafe` uses Redis cache (cache-aside pattern) — fast

---

## 15. Routes

### `notification.routes.ts`

```typescript
router.use(authenticate);
```
- Applies auth middleware to ALL routes below it. You must be logged in to read/manage your own notifications.

```typescript
router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markRead);
router.patch("/read-all", NotificationController.markAllRead);
```

> ⚠️ **Route Order Matters**: `"/read-all"` must be registered BEFORE `"/:id/read"`. If you put `/:id` first, Express would match `read-all` thinking `read-all` is the `:id` parameter!

### `firebase.routes.ts`

```typescript
router.post("/save-token", saveToken);
router.get("/get-token", getToken);
router.post("/send-to-all-users", sendPushToUser);
```

- `save-token` = called when browser grants notification permission
- `get-token` = debug endpoint to see stored tokens
- `send-to-all-users` = admin broadcast endpoint (currently returns 501 Not Implemented)

---

## 16. Firebase Client — `frontend/src/lib/firebase.ts`

```typescript
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
```
- `initializeApp` = Firebase Client SDK initialization (not Admin SDK!)
- `getMessaging` = returns the Firebase Cloud Messaging instance for the browser — used to get FCM tokens

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
```
- All `NEXT_PUBLIC_` = exposed to the browser (Next.js convention)
- These are **not secrets**. The Firebase config is a public identifier for your Firebase project. Security is enforced by Firebase security rules and Auth, not by keeping these keys secret.
- `messagingSenderId` = the GCM Sender ID. The browser uses this to know which Firebase project to subscribe to.

```typescript
const app = initializeApp(firebaseConfig);

let messaging: any = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}
```
- `initializeApp(firebaseConfig)` = creates the Firebase app instance
- `typeof window !== "undefined"` guards against **SSR** (Server-Side Rendering). Next.js runs your code on the server too. `getMessaging` requires a browser environment (it uses Service Workers internally). Without this guard, Next.js would crash on the server.
- `messaging` starts as `null`, then becomes the Messaging instance on the client

```typescript
export { messaging };
```
- Exported for use in components that call `getToken(messaging, { vapidKey })` to get the FCM registration token

---

## 17. The Socket Context — `context/SocketContext.tsx`

```typescript
"use client";
```
- Next.js directive: this component only runs in the browser, not on the server. Required because we use browser APIs (`localStorage`) and WebSocket connections.

```typescript
import { io, Socket } from "socket.io-client";
```
- `socket.io-client` = the CLIENT side of Socket.IO. Different package from the server's `socket.io`.
- `io` = factory function to create a socket connection
- `Socket` = TypeScript type for the socket instance

```typescript
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});
```
- React Context definition. Default value = `{ socket: null, isConnected: false }` (used if a component consumes the context outside a Provider — defensive default)
- We store the socket instance in React Context so any component deep in the tree can access it without prop-drilling

```typescript
export const useSocket = () => useContext(SocketContext);
```
- A simple hook that abstracts `useContext(SocketContext)`. Any component can do `const { socket } = useSocket()` instead of importing both `useContext` and `SocketContext`.

```typescript
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
```
- `SocketProvider` wraps the app. It creates the socket connection once and shares it.
- `useState<Socket | null>(null)` = starts as `null` (no connection yet)

```typescript
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
```
- `useEffect` with `[]` dep array = runs once when the component mounts (once on page load)
- `localStorage.getItem("accessToken")` = retrieves the JWT. If no token, the user isn't logged in → no socket connection needed → early return
- The JWT is stored in `localStorage` by your auth logic on login

```typescript
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { token },
      withCredentials: true,
    });
```
- `io(url, options)` = establishes the Socket.IO connection to your backend
- `process.env.NEXT_PUBLIC_API_URL` = `"https://dev.hayon.site:5000/api"` from `.env.local`. Wait — this is the API URL WITH `/api`. But Socket.IO doesn't go through `/api`. So the socket actually connects to `https://dev.hayon.site:5000` (Socket.IO strips the path automatically when using the default namespace)
- `auth: { token }` = this is what `socket.handshake.auth.token` reads on the server in `socket.ts` middleware. You're passing the JWT here.
- `withCredentials: true` = send cookies along with the WebSocket upgrade request

```typescript
    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    setSocket(socketInstance);
```
- `"connect"` = Socket.IO event fired when connection is established and server has accepted it
- `"disconnect"` = fired when connection drops (network issue, server restart, etc.)
- `setSocket(socketInstance)` = stores the socket in React state, triggering re-render, making it available to all consumers of the context

```typescript
    return () => {
      socketInstance.disconnect();
    };
  }, []);
```
- `useEffect` cleanup function: called when the `SocketProvider` unmounts (page navigation, app teardown)
- `disconnect()` = cleanly closes the WebSocket connection, freeing server resources
- Without this, you'd have zombie connections on the server

---

## 18. The Hook — `useNotifications.ts`

```typescript
export interface Notification {
  _id: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  image?: string;
  link?: string;
  relatedResource?: {
    type: "post" | "login";
    id: any; // Populated post or login data
    model: string;
  };
  createdAt: string;
}
```
- Frontend TypeScript interface mirroring the backend Mongoose model
- `id: any` — after `.populate()` on the backend, this is the full Post object (not just ObjectId). `any` is used because the populated shape varies.
- `createdAt: string` — in JSON responses, Mongoose Date objects become ISO 8601 strings: `"2024-02-21T09:45:31.000Z"`

```typescript
export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
```
- Gets the socket from context via `useSocket()`
- Two pieces of state: the array of notifications and the count of unread ones

### Initial Fetch (REST API)

```typescript
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications`);
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.notifications.filter((n: any) => !n.read).length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, []);
```
- On mount, fetch historic notifications from REST API
- `res.data.data.notifications` = the response shape is `{ success: true, message: "...", data: { notifications: [], total: N, page: 1, pages: N } }`
- `.filter((n) => !n.read).length` = count locally by filtering — avoids an extra API call

### Real-Time Listener (Socket.IO)

```typescript
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);
```
- `if (!socket) return` — if socket isn't connected yet, don't try to listen
- `[socket]` in dep array = effect re-runs when the socket changes (when it connects or reconnects)
- `socket.on("notification", handleNotification)` = register listener for the `"notification"` event (exactly what the server emits)
- `(prev) => [newNotification, ...prev]` = **functional state update** (safe in React). Prepends new notification to the front of the array.
- `prev + 1` = increment unread count
- **Cleanup**: `socket.off("notification", handleNotification)` = remove this specific listener when socket changes or component unmounts. Without this, you'd register duplicate listeners every time the socket reconnects.

### Mark As Read

```typescript
  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };
```
- PATCH to the API first (source of truth)
- Then **optimistic local update**: mutate state locally without waiting for another fetch. `prev.map(...)` creates a new array where only the clicked notification has `read: true`.
- `Math.max(0, prev - 1)` — never go negative (defensive)

```typescript
  const markAllAsRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };
```
- PATCH → set all to read locally → unreadCount = 0

---

## 19. The UI — `NotificationDropdown.tsx`

### The Bell Button

```typescript
<Button variant="ghost" size="icon" className="relative ...">
  <Bell className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
  )}
</Button>
```
- Conditional red dot: only renders if `unreadCount > 0`
- `animate-pulse` = Tailwind's pulsing animation — draws the user's eye
- `absolute` positioned relative to the `relative` button container

### The Backdrop Blur

```typescript
<DropdownMenuPortal>
  {isOpen && (
    <div className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-300" />
  )}
</DropdownMenuPortal>
```
- `DropdownMenuPortal` = renders into a portal (outside the normal DOM tree, at the document body level). This prevents z-index/overflow issues.
- `fixed inset-0` = full screen overlay
- `backdrop-blur-[2px]` = blurs everything behind the dropdown (glassmorphism effect)
- `animate-in fade-in` = entrance animation using `tailwindcss-animate`

### `highlightMessage()` — Text Coloring

```typescript
const highlightMessage = (message: string) => {
  const platforms = ["bluesky", "threads", "tumblr", "mastodon", "facebook", "instagram"];
  const statusKeywords = ["pending", "scheduled", "posted"];
  const allKeywords = [...platforms, ...statusKeywords];
  const regex = new RegExp(`(${allKeywords.join("|")})`, "gi");
  const parts = message.split(regex);
  return parts.map((part, i) => { ... });
};
```
- Builds a regex like `/(bluesky|threads|tumblr|mastodon|...|pending|scheduled|posted)/gi`
- `gi` = case insensitive, global (find all occurrences)
- `message.split(regex)` = splits the message INTO the matched parts. With a capturing group `()`, `split` includes the matched strings in the result array!
- Example: `"Your post on Instagram has been posted"` → `["Your post on ", "Instagram", " has been ", "posted", ""]`
- Then `parts.map(...)` wraps each matched keyword in a styled `<span>` with its brand color

### The Rich Media Layout

```typescript
const postImage =
  notification.image ||
  (notification.relatedResource?.type === "post"
    ? notification.relatedResource.id?.content?.mediaItems?.[0]?.s3Url
    : null);
const isPosted = notification.message.toLowerCase().includes("successfully posted");
const useRichLayout = isPosted && postImage;
```
- `notification.image` = explicit image URL from notification (if set)
- Falls back to `relatedResource.id?.content?.mediaItems?.[0]?.s3Url` — the populated Post document's first media item's S3 URL. This is why we `.populate("relatedResource.id")` in the repository.
- `useRichLayout` = true only for "successfully posted" notifications WITH an image → shows the full-width banner layout with post thumbnail

---

## 20. Environment Variables — Where Each One Comes From

### Backend — NO env vars needed for notifications specifically

The notification system on the backend uses:
- `ENV.AUTH.ACCESS_TOKEN_SECRET` — for JWT verification in socket middleware (already exists for auth)
- `serviceAccountKey.json` — hardcoded file path, no env var

### Frontend `.env.local`

| Variable | Value | Where It Comes From |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://dev.hayon.site:5000/api` | Your backend server URL |
| `NEXT_PUBLIC_VAPID_KEY` | `BFWmxXmX5HUj7i...` | Firebase Console → Project Settings → Cloud Messaging → Web Push certificates |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBFxGm...` | Firebase Console → Project Settings → General → Your apps → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `hayon-app.firebaseapp.com` | Same place, auto-generated |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `hayon-app` | Your Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `hayon-app.firebasestorage.app` | Same place |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1094405093952` | Same place — the GCM Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1094405...` | Same place — unique to this web app registration |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-XNDZBY...` | Google Analytics linked to Firebase |

---

## 21. Firebase Console — Every Step You Took

Here's exactly what you did on the Firebase Console to make this work:

### Step 1: Create the Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Name it `hayon-app` (this becomes the `project_id`)
4. Enable/disable Google Analytics (you enabled it — that's where `measurementId` comes from)

### Step 2: Register Your Web App
1. In the project overview, click the `</>` icon (Web)
2. Register the app with a nickname (e.g., "Hayon Web")
3. Firebase shows you the `firebaseConfig` object:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBFxGmN3aW38F6KA0rF7dbV3kSc0TRokig",
  authDomain: "hayon-app.firebaseapp.com",
  projectId: "hayon-app",
  storageBucket: "hayon-app.firebasestorage.app",
  messagingSenderId: "1094405093952",
  appId: "1:1094405093952:web:b105162e509a0875cffda5",
  measurementId: "G-XNDZBYH6PQ"
};
```
4. You copied all these values into your `frontend/.env.local`

### Step 3: Enable Cloud Messaging
1. Go to **Project Settings** (gear icon)
2. Click **Cloud Messaging** tab
3. Under **Web configuration**, click **Generate key pair**
4. Firebase generates a VAPID key pair. You copy the **public key** (the long `BFWmxX...` string)
5. Add it as `NEXT_PUBLIC_VAPID_KEY` in `.env.local`
6. The private key stays on Google's servers — you never see it

### Step 4: Generate Service Account Key
1. Go to **Project Settings** → **Service accounts** tab
2. You'll see "Firebase Admin SDK" — "Node.js" selected by default
3. Click **Generate new private key**
4. Google generates and downloads `serviceAccountKey.json`
5. You placed this file at `backend/src/serviceAccountKey.json`
6. Added it to `.gitignore`

### What Happened Behind The Scenes When You Generated Keys
- Google Cloud created a **service account**: `firebase-adminsdk-fbsvc@hayon-app.iam.gserviceaccount.com`
- Generated an RSA key pair
- Stored the public key on Google's servers
- Gave you the private key in the JSON file
- Granted this service account the "Firebase Admin" IAM role on your GCP project

---

## 22. The Full Journey: From Admin Approval to Bell Icon

Let's trace the entire flow for a real event: **Admin approves a post**.

### Step 1: Admin Clicks "Approve" in Admin Panel
```
POST /api/admin/posts/:id/approve
```

### Step 2: Admin Controller Calls NotificationService
```typescript
// Somewhere in admin posts handler:
await NotificationService.createNotification(
  post.userId,              // recipientId
  `Your post "${post.title}" on Instagram has been posted successfully`,
  "success",                // type
  { type: "post", id: post._id, model: "Post" },  // relatedResource
  {
    image: post.content.mediaItems[0]?.s3Url,    // thumbnail
    link: `/posts/${post._id}`,                  // click destination
  }
);
```

### Step 3: Notification Service Runs (4 things in sequence)

**3a. Build notification data object**
```typescript
{
  recipient: ObjectId("65a3b..."),
  message: "Your post on Instagram...",
  type: "success",
  image: "https://hayon-bucket.s3.amazonaws.com/...",
  link: "/posts/65a3b...",
  relatedResource: { type: "post", id: ObjectId("65a3b..."), model: "Post" }
}
```

**3b. MongoDB Insert**
```
MongoDB ← Notification.create(notificationData)
MongoDB returns: { _id: ObjectId("abc123"), ...allFields, createdAt: Date.now() }
```

**3c. Socket.IO Emit** (if user is online)
```
io.to("65a3b...")            ← room named after userId
  .emit("notification", {...}) ← sends full notification document
```

**3d. FCM Push** (always attempted)
```
MongoDB ← User.findById(recipientId).select("fcmTokens")
→ user.fcmTokens = ["eXBsK3...", "f9Kl2..."]  (2 devices)

Google FCM API ← admin.messaging().sendEachForMulticast({
  notification: { title: "Hayon - Your post has been approved", body: "..." },
  tokens: ["eXBsK3...", "f9Kl2..."]
})

Google FCM → User's Chrome on laptop  (OS notification popup)
Google FCM → User's Firefox on phone  (OS notification popup)
```

### Step 4: Frontend Receives (Two Paths)

**Path A: User has tab open (Socket.IO)**
```
socket.on("notification", handleNotification)
  → setNotifications(prev => [newNotification, ...prev])
  → setUnreadCount(prev => prev + 1)
  → Bell icon re-renders with red pulsing dot
```

**Path B: User's tab is closed (FCM)**
```
Service Worker receives push message
→ OS shows notification: "Hayon - Your post has been approved"
   "Your post on Instagram has been posted successfully"
→ User clicks notification → browser opens → navigates to /posts/65a3b...
```

### Step 5: User Opens Notification Dropdown
```
Initial render: useEffect → GET /api/notifications
→ NotificationController.getNotifications
→ NotificationService.getUserNotifications
→ NotificationRepository.findByUserId (paginated, sorted, populated)
→ Returns: { notifications: [...], total: 5, page: 1, pages: 1 }
→ setNotifications([...])
→ setUnreadCount(notifications.filter(n => !n.read).length)
```

### Step 6: User Clicks the Notification
```
onClick handler:
1. markAsRead(notification._id)
   → PATCH /api/notifications/abc123/read
   → NotificationRepository.markAsRead (requires both _id AND userId — security!)
   → setNotifications(prev => prev.map(n => n._id === id ? {...n, read: true} : n))
   → setUnreadCount(prev => Math.max(0, prev - 1))

2. notification.link = "/posts/65a3b..."
   → router.push("/posts/65a3b...")
   → Next.js navigates to that page
```

---

## 23. What's Incomplete / Can Be Improved

### 1. `sendPushToUser` is not implemented
```typescript
export const sendPushToUser = async (req: Request, res: Response) => {
  return new ErrorResponse("Not implemented").send(res);
};
```
The admin broadcast endpoint returns 501. You could implement: get all FCM tokens from all users, batch into groups of 500 (FCM multicast limit), send.

### 2. Token Deduplication
`updateUser` uses `$push` blindly:
```typescript
User.findByIdAndUpdate(userId, { $push: { fcmTokens: token } });
```
If the same browser registers twice, you'd have duplicate tokens. Fix:
```typescript
User.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } });
```
`$addToSet` = only adds if not already in the array.

### 3. API URL vs Socket URL
```typescript
const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {...});
```
`NEXT_PUBLIC_API_URL` is `https://dev.hayon.site:5000/api`. Socket.IO would try to connect to `https://dev.hayon.site:5000/api` which is technically wrong — the socket endpoint is at the root `https://dev.hayon.site:5000`. Socket.IO usually handles this but it's cleaner to have a separate `NEXT_PUBLIC_SOCKET_URL` env var.

### 4. No Notification Deletion
The UI lets you mark as read but never delete. Old notifications accumulate forever. You should add:
- `DELETE /api/notifications/:id` endpoint
- A cron job that deletes notifications older than 30 days

### 5. Sound / Vibration
Push notifications can include sound. FCM supports `notification.sound` for mobile. Not implemented.

### 6. Service Worker for Background Push
The frontend FCM setup (`lib/firebase.ts`) gets the token, but you need a `public/firebase-messaging-sw.js` **Service Worker** to actually show OS notifications when the tab is closed. Without a service worker, FCM push messages are only received when the tab is open (where Socket.IO already handles it). The service worker file would look like:
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({ messagingSenderId: "1094405093952", ... });
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png',
  });
});
```

### 7. `console.log(res)` in Production
```typescript
const res = await api.get(`/notifications`);
console.log(res);
```
This `console.log` in `useNotifications.ts` will log on every page load in production. Remove it.

---

*End of Notifications Masterclass. Every line of code, every concept, every system interaction explained.*

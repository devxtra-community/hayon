# Socket.IO Implementation & Architecture

This document explains the current implementation of Socket.IO in our application for real-time notifications.

## 🏗️ Architecture Overview

The system follows a **Client-Server** architecture where the backend acts as the real-time event broadcaster and the frontend acts as the listener.

### 1. Backend (The Server)

- **Location:** `backend/src/config/socket.ts` and initialized in `backend/src/app.ts`.
- **Functionality:**
  - It runs on the **same server** as our Express API.
  - **Authentication:** It intercepts the connection (handshake) and verifies the JWT token.
  - **User Isolation:** Upon successful connection, the socket joins a "room" named after the `userId`. This allows us to send notifications to specific users (`io.to(userId).emit(...)`).
  - **Lifecycle:** It manages connections and disconnections, logging when users come online or go offline.

### 2. Frontend (The Client)

- **Location:** `frontend/src/context/SocketContext.tsx` and `frontend/src/hooks/useNotifications.ts`.
- **Functionality:**
  - **SocketProvider:** A React Context provider that initializes the socket connection when the user logs in.
  - **useNotifications Hook:** Subscribes to the `"notification"` event. When a new notification is received via the socket, it updates the local state, making the UI update instantly without a page refresh.

---

## ❓ FAQ & Considerations

### 1. "Did we add Socket.IO to the frontend server?"

**No.** We added the **Socket.IO Server** to the backend. The frontend is running the **Socket.IO Client**.

- The **Backend** is the one "pushing" the data.
- The **Frontend** is the one "listening" for the data.

### 2. "So we don't have to separately connect from the frontend?"

**Clarification:** You **do** connect from the frontend, but you only have to do it **once**.

- We implemented a `SocketProvider` in `frontend/src/context/SocketContext.tsx`.
- This code automatically connects when the user logs in.
- **Good news:** You don't need to write connection code in your pages or components. You just use `useSocket()` or `useNotifications()` and it "just works" using that one global connection.

### 3. "Do I need to run a third server?"

**No.** Because the Socket server is **attached** to your Express app:

- You only run `pnpm run dev` in the backend.
- You only run `pnpm run dev` in the frontend.
- There is no "Socket Server" command to run separately. It lives inside your backend process.

### 4. "Should we create a separate server for Socket.IO?"

Currently, Socket.IO is integrated into the existing Express server. Here is a comparison:

#### **Current Approach (Integrated)**

- ✅ **Pros:**
  - Simpler deployment (one server to manage).
  - Shared authentication logic and environment variables.
  - No "Cross-Origin" issues if they run on the same port (though we handle CORS anyway).
- ❌ **Cons:**
  - If the number of concurrent connections grows to tens of thousands, it can consume resources (RAM/CPU) that the API needs.

#### **Separate Server Approach**

- ✅ **Pros:**
  - **Scalability:** You can scale the Socket server independently from the API server.
  - **Isolation:** A bug that crashes the Socket server won't take down the REST API.
- ❌ **Cons:**
  - More complex infrastructure.
  - Requires a way for the API to "talk" to the Socket server (usually via Redis Pub/Sub) to trigger notifications.

### **Recommendation**

**Continue with the current approach.**
For the current scale of the application, keeping it integrated is the industry standard. It reduces complexity and makes development faster. We should only move to a separate server if we anticipate millions of concurrent users or if the Socket server starts affecting API performance.

---

## 🚀 How it works in practice (Example)

1.  **User A** creates a post.
2.  The **Backend Controller** saves the post and the notification to the database.
3.  The **Backend Repository** (or service) calls `io.to(targetUserId).emit('notification', data)`.
4.  **User B's Frontend**, which is listening for that event, receives the `data`.
5.  The `useNotifications` hook updates the UI, and the red dot appears on the notification bell instantly.

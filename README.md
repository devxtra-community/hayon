# 🚀 Hayon – Social Media Auto-Poster (Monorepo)

Hayon is a **full-stack social media automation platform** built as a **single monorepo** containing both the frontend and backend.

The system allows users to create, schedule, and automatically publish posts across multiple social platforms, with **AI-generated captions**, analytics, notifications, and admin controls.

This repository contains:

* A **Next.js frontend**
* A **Node.js + Express backend**
* Shared infrastructure dependencies (Redis, RabbitMQ)

Frontend and backend are developed and run **independently**, but live in the same repository.

---

## 📁 Repository Structure

```bash
hayon/
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (page.tsx, layouts, etc.)
│   │   ├── components/
│   │   ├── assets/
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   ├── .env.local
│   └── prettier.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── interfaces/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── package.json
│   └── .env
│
└── README.md
```

There is **no shared runtime code** between frontend and backend. Communication happens strictly via HTTP APIs.

---

## 🎯 Project Purpose

Hayon solves one main problem:

> **Managing and publishing content across multiple social media platforms from a single place.**

The platform supports:

* Multi-platform post publishing
* AI-generated, platform-specific captions
* Scheduled and immediate posting
* Background processing using queues
* Analytics and usage tracking
* Notifications for post success/failure
* Subscription and payment handling
* Admin-level user management

This is a **production-oriented system**, not a demo or a toy project.

---

## 🛠️ Tech Stack

### Frontend

* Next.js (App Router)
* Tailwind CSS
* shadcn/ui
* Recharts

### Backend

* Node.js
* Express
* MongoDB
* JWT authentication + Google OAuth

### Infrastructure / Services

* **Redis** – caching, session-like data, rate limiting
* **RabbitMQ** – background jobs and async processing
* **AWS S3** – image storage
* **Stripe** – payments and subscriptions
* **Google Gemini API** – AI caption generation

### Deployment

* Frontend: **Vercel**
* Backend: **AWS EC2**

---

## 🌿 Branch Strategy

This repository uses **three long-living branches**.

### `main`

* Production branch
* Deployed to live environment
* Must always be stable
* No direct commits

### `staging`

* Pre-production testing
* Mirrors production as closely as possible
* Used for QA and final validation

### `dev`

* Active development branch
* All feature work merges here first

### Feature Branches

* Branch off from `dev`
* Example:
  * `feature/ai-captions`
  * `feature/post-scheduler`
  * `feature/stripe-integration`

### Merging Rules

* `feature/*` → `dev`
* `dev` → `staging`
* `staging` → `main`

**Skipping branches is how bugs reach production.**

---

## 💻 Local Development Setup

Frontend and backend **must be run separately**.

### Prerequisites

* Node.js v18+
* MongoDB (local or Atlas)
* Redis
* RabbitMQ

⚠️ If Redis or RabbitMQ are not running, **background jobs will fail**. That's expected.

---

## 🔧 Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=4000

MONGO_URI=mongodb://localhost:27017/hayon

JWT_SECRET=super-secret
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=xxx
AWS_S3_BUCKET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AI
GEMINI_API_KEY=xxx
```

Run backend:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:4000
```

---

## 🎨 Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🔄 High-Level System Flow

1. User authenticates (Google OAuth or Email + OTP)
2. User connects social media accounts
3. User creates a post (text + optional image)
4. Images are uploaded to **AWS S3**
5. AI generates platform-specific captions
6. User schedules or publishes immediately
7. Jobs are pushed to **RabbitMQ**
8. Workers process publishing asynchronously
9. Redis is used for caching and fast lookups
10. Post status, analytics, and notifications are updated

**Frontend never communicates directly** with social media APIs or third-party services.

---

## 🤝 Contribution Rules

* Do not commit directly to `main`
* Keep frontend and backend changes scoped
* No "quick fixes" bypassing `staging`
* Auth, payments, and queue logic are sensitive — test before merging

---

## 📄 License

Private / Internal  
Not intended for public redistribution.

---
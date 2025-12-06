# 🚀 Hayon - Social Media Auto-Poster

A modern social media management platform that allows users to create, schedule, and automatically post content across multiple platforms with AI-powered caption generation.

## 📋 Project Overview

**Social Media Auto-Poster** helps content creators, freelancers, and personal brands/ small business manage their social media presence efficiently by:
- Creating posts once and publishing to multiple platforms
- Generating platform-specific captions using AI
- Scheduling posts for optimal timing
- Tracking performance with detailed analytics

## ✨ Key Features

### For Users
- 🔐 **Easy Authentication** - Google OAuth or email/password signup
- 🌐 **Multi-Platform Support** - Reddit, Facebook, Instagram, Bluesky, Threads
- 🤖 **AI Caption Generation** - Unique captions for each platform using Google Gemini
- 📅 **Smart Scheduling** - Schedule posts for future dates and times
- 📊 **Analytics Dashboard** - Track engagement, likes, comments, and shares
- 📱 **Post Management** - Drafts, scheduled, published, and failed posts tracking
- 🔔 **Real-time Notifications** - Get notified when posts publish or fail

### For Admins
- 👥 **User Management** - View and manage all users
- 📈 **Usage Monitoring** - Track API calls, AI generations.
- 🔧 **Manual Upgrades** - Support team can upgrade users manually
- 🚨 **Failed Post Monitoring** - Real-time alerts for posting issues

## 🏗️ Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Node.js + Express (REST API)
- **Database**: MongoDB Atlas
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: jwt+google oauth
- **Charts**: Recharts


### External Services
- **AI**: Google Gemini API (free tier)
- **Image Storage**: Cloudinary (free tier)
- **Payment**: Stripe
- **Deployment**: Vercel + Render

### Social Media APIs
- Reddit API (OAuth 2.0)
- Facebook Graph API (OAuth 2.0)
- Instagram Graph API (via Facebook)
- Bluesky AT Protocol (App Password)
- Threads API (OAuth 2.0)


## 🔄 How It Works

### Post Creation Flow
1. User logs in and connects social media accounts (OAuth)
2. User creates a post with text and optional image
3. User selects target platforms
4. AI generates unique captions for each platform
5. User can edit captions or regenerate
6. User schedules post or posts immediately
7. Post saved to database with status "scheduled"



**Built with ❤️ for content creators**
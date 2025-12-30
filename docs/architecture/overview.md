# Architecture Overview

This document describes the high-level architecture of the platform, including component responsibilities, data stores, and communication patterns.

## System Architecture

The platform follows a monolithic architecture with asynchronous processing capabilities for background tasks.

* **Synchronous communication**: REST APIs
* **Asynchronous communication**: RabbitMQ (message queue for background jobs)

```
┌─────────────────┐
│  USER/ADMIN     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    FRONTEND     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│     API ENDPOINTS/MAIN SERVER               │
│  - Authentication & Authorization           │
│  - Business Logic                           │
│  - Request Handling                         │
│  - API Routes                               │
└─┬─────┬──────┬────────┬─────────────┬──────┘
  │     │      │        │             │
  │     │      │        │             ▼
  │     │      │        │    ┌──────────────────┐
  │     │      │        │    │  AI GENERATION   │
  │     │      │        │    │   API (GEMINI)   │
  │     │      │        │    └──────────────────┘
  │     │      │        │
  │     │      │        ▼
  │     │      │   ┌─────────────────┐
  │     │      │   │ MESSAGE QUEUE   │
  │     │      │   │   (RABBITMQ)    │
  │     │      │   └────┬───────┬────┘
  │     │      │        │       │
  │     │      │        ▼       ▼
  │     │      │   ┌─────────┐ ┌──────────────┐
  │     │      │   │  POST   │ │  ANALYTICS   │
  │     │      │   │ WORKER  │ │   WORKER     │
  │     │      │   └────┬────┘ └──────┬───────┘
  │     │      │        │             │
  │     │      │        ▼             │
  │     │      │   ┌─────────────────────────┐
  │     │      │   │  SOCIAL MEDIA APIs      │
  │     │      │   │  - Instagram            │
  │     │      │   │  - Facebook/Threads     │
  │     │      │   │  - Bluesky/Reddit       │
  │     │      │   └─────────────────────────┘
  │     │      │
  ▼     ▼      ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ DATABASE │ │  CACHE   │ │  MEDIA   │
│ MONGODB  │ │  REDIS   │ │  STORE   │
│          │ │          │ │  R2/S3   │
└──────────┘ └──────────┘ └──────────┘
```

## Component Responsibilities

### Frontend
* User interface for end users and administrators
* Communicates with the main server via REST APIs
* Handles client-side rendering and user interactions

### API Endpoints/Main Server
* Central application server handling all business logic
* **Authentication & Authorization**: Manages user sessions and access control
* **Request Processing**: Handles all API requests from the frontend
* **Database Operations**: Direct communication with MongoDB for data persistence
* **Cache Management**: Uses Redis for performance optimization
* **Media Handling**: Manages file uploads/downloads with R2/S3 storage
* **Message Publishing**: Sends tasks to RabbitMQ for asynchronous processing
* **AI Integration**: Interfaces with Gemini API for AI-powered features

### Message Queue (RabbitMQ)
* Decouples synchronous API requests from time-consuming background tasks
* Ensures reliable message delivery between the main server and workers
* Enables horizontal scaling of worker processes

### Workers

#### Post Worker
* Processes social media posting tasks asynchronously
* Integrates with multiple social media platform APIs:
  * Instagram
  * Facebook/Threads
  * Bluesky
  * Reddit
* Handles posting failures and retries
* Updates database with posting status

#### Analytics Worker
* Processes analytics data collection and aggregation
* Generates reports and metrics
* Performs data analysis tasks without blocking the main server

### External Services

#### AI Generation API (Gemini)
* Provides AI-powered content generation
* Used for creating captions, suggestions, or other AI features

#### Social Media APIs
* Third-party APIs for posting content to various platforms
* Each platform has its own authentication and rate limits

## Data Stores

| Technology | Usage |
|------------|-------|
| **MongoDB** | Primary database for users, posts, content, settings, and application data |
| **Redis** | Caching layer for session management, rate limiting, and frequently accessed data |
| **R2/S3** | Media storage for images, videos, and other user-uploaded files |

## Communication Patterns

### Synchronous Flow
1. User interacts with Frontend
2. Frontend sends HTTP request to Main Server
3. Main Server processes request, queries Database/Cache
4. Response returned immediately to Frontend

### Asynchronous Flow
1. Main Server receives request requiring background processing
2. Main Server publishes message to RabbitMQ
3. Main Server immediately returns acknowledgment to Frontend
4. Worker picks up message from queue
5. Worker processes task (e.g., posts to social media)
6. Worker updates Database with results
7. Frontend can poll or receive notifications about task completion

## Key Design Decisions

* **Monolithic Architecture**: Simplifies deployment and development while maintaining code cohesion
* **Message Queue for Background Tasks**: Prevents long-running operations from blocking API responses
* **Worker-Based Processing**: Isolates social media integrations and analytics from the main application flow
* **Redis Caching**: Improves response times for frequently accessed data
* **External Media Storage**: Offloads static file serving and provides scalable storage
* **AI Integration**: Enhances user experience with intelligent content generation

## Scalability Considerations

* **Horizontal Worker Scaling**: Multiple worker instances can process messages in parallel
* **Cache-First Strategy**: Redis reduces database load for read-heavy operations
* **Asynchronous Processing**: Non-critical operations don't block user requests
* **CDN Integration**: Media files can be served through CDN for global distribution
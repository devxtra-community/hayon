# RabbitMQ Queue Architecture - DELAYED MESSAGE EXCHANGE PLUGIN

## Overview

This document explains the queue architecture using the **Delayed Message Exchange Plugin** for scheduling.

---

## Message Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCER (Backend)                            │
└─────────────────────┬───────────────────────────────┬───────────────────┘
                      │                               │
              (immediate)                     (scheduled)
                      │                               │
                      ▼                               ▼
┌─────────────────────────────────┐   ┌───────────────────────────────────┐
│       POST_EXCHANGE             │   │    POST_DELAYED_EXCHANGE          │
│         (topic)                 │   │     (x-delayed-message)           │
└─────────────┬───────────────────┘   └────────────────┬──────────────────┘
              │                                        │
              │                                 [plugin waits]
              │                                 [delay expires]
              │                                        │
              └──────────────────┬─────────────────────┘
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │      SOCIAL_POSTS         │
                   │     (main queue)          │
                   └─────────────┬─────────────┘
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │         WORKER            │
                   └─────────────┬─────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
         success              failure            max retries
            │                    │                    │
            ▼                    ▼                    ▼
          ACK              RETRY_QUEUE           PARKING_LOT
                           (with TTL)
```

---

## Plugin Installation

```bash
# Docker
docker exec rabbitmq rabbitmq-plugins enable rabbitmq_delayed_message_exchange
docker restart rabbitmq

# Local
rabbitmq-plugins enable rabbitmq_delayed_message_exchange

# Verify
rabbitmq-plugins list | grep delayed
# Should show: [E*] rabbitmq_delayed_message_exchange
```

---

## Exchanges

| Exchange | Type | Purpose |
|----------|------|---------|
| `post_exchange` | topic | Immediate posts |
| `post_delayed_exchange` | x-delayed-message | Scheduled posts |
| `dlx_exchange` | direct | Failed messages |

## Queues

| Queue | Purpose |
|-------|---------|
| `hayon_social_posts` | Main processing |
| `hayon_retry_queue` | Failed retries (TTL) |
| `hayon_parking_lot` | Permanently failed |
| `hayon_dead_letters` | Inspection |

---

## Scheduling: Plugin vs TTL

| Aspect | Plugin (Current) | TTL (Old) |
|--------|------------------|-----------|
| Head-of-line blocking | ❌ No | ✅ Yes |
| Independent delays | ✅ Yes | ❌ No |
| Cancel scheduled | ❌ Hard | ❌ Hard |
| Requires plugin | ✅ Yes | ❌ No |

**Why Plugin?** The TTL approach has head-of-line blocking - a 1-hour message blocks 5-minute messages behind it.

---

## Files

| File | Changes Made |
|------|--------------|
| `types.ts` | Removed WAITING_ROOM, added DLX constants |
| `producer.ts` | Uses `x-delayed-message` exchange with `x-delay` header |
| `workers/index.ts` | Asserts delayed exchange, binds both exchanges to queue |
| `dlx.setup.ts` | DLX now only for failed messages, not scheduling |

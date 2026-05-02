# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY schemas/ ./schemas/

COPY frontend/package.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/next.config.ts ./frontend/
COPY frontend/postcss.config.mjs ./frontend/
COPY frontend/components.json ./frontend/
COPY frontend/public/ ./frontend/public/
COPY frontend/src/ ./frontend/src/

RUN pnpm install --frozen-lockfile

RUN cd schemas && pnpm run build

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VAPID_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_VAPID_KEY=$NEXT_PUBLIC_VAPID_KEY
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID


RUN sed -i "s|NEXT_PUBLIC_FIREBASE_API_KEY_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_API_KEY}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_PROJECT_ID_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_PROJECT_ID}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_APP_ID_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_APP_ID}|g" /app/frontend/public/firebase-messaging-sw.js && \
    sed -i "s|NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_PLACEHOLDER|${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}|g" /app/frontend/public/firebase-messaging-sw.js

RUN cd frontend && pnpm run build

# ============================================================
# Stage 2: Production Runtime (standalone)
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

CMD ["node", "frontend/server.js"]

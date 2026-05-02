# ============================================================
# Stage 1: Builder
# ============================================================

FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY schemas/ ./schemas/

COPY backend/package.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/src/ ./backend/src/

RUN pnpm install --frozen-lockfile

RUN cd schemas && pnpm run build

RUN cd backend && pnpm run build


# ============================================================
# Stage 2: Production Runtime
# ============================================================
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY --from=builder /app/schemas/ ./schemas/

COPY backend/package.json ./backend/

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/src/serviceAccountKey.json ./backend/dist/serviceAccountKey.json

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/app.js"]

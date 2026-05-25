# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /build

# Package files first for Docker layer caching
COPY apps/frontend/package*.json ./apps/frontend/

# scss-library and shared types needed at build time
COPY packages/scss-library/ ./packages/scss-library/
COPY packages/shared/src/   ./packages/shared/src/

# Install Angular dependencies
RUN cd apps/frontend && npm install

# Copy Angular source and config
COPY apps/frontend/src/         ./apps/frontend/src/
COPY apps/frontend/public/      ./apps/frontend/public/
COPY apps/frontend/angular.json ./apps/frontend/angular.json
COPY apps/frontend/tsconfig*.json ./apps/frontend/

# Build Angular app (production)
RUN cd apps/frontend && npx ng build --configuration production

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Copy compiled Angular app to nginx web root
COPY --from=builder /build/apps/frontend/dist/frontend/browser/ /usr/share/nginx/html/

# Custom nginx config (SPA routing + API proxy)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

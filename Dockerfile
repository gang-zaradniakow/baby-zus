# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
ENV CI=1 EXPO_NO_TELEMETRY=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
# Adres backendu wkompilowany w bundle (np. /api/baby-zus-backend); pusty = http://localhost:8080
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
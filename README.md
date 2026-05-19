# WorkSpace2K

> Self-hosted management portal for your personal homelab.

Manage all your Docker services, monitor system resources and control your infrastructure — from a single, clean interface built entirely by yourself.

---

## Features

- **Service Dashboard** — live status of all running Docker containers
- **Dark / Light Mode** — persistent theme per device
- **Role-based Access** — admin and user roles with route protection
- **JWT Authentication** — secure, stateless sessions
- **PWA** — installable as a desktop or mobile app

---

## Stack

|                | Technology                     |
| -------------- | ------------------------------ |
| Frontend       | Angular 21 · NgRx 19 · SCSS    |
| Backend        | Node.js · Express · TypeScript |
| Database       | PostgreSQL 17 · Prisma ORM     |
| Infrastructure | Docker · Nginx Proxy Manager   |

---

## Quick Start

```bash
git clone https://github.com/KosMaster87/WorkSpace2K.git
cd WorkSpace2K

# Start dev database
cd docker && docker compose -f docker-compose.dev.yml up -d

# Backend
cd ../apps/backend && cp .env.example .env && npm install && npm run dev

# Frontend
cd ../apps/frontend && npm install && ng serve
```

Open `http://localhost:4200`

---

## Project Structure

```
workspace2k-app/
├── apps/
│   ├── frontend/          Angular 21 app
│   └── backend/           Express REST API
├── packages/
│   ├── shared/            Shared TypeScript types
│   └── scss-library/      @dev2k/scss-library — Design tokens & mixins
└── docker/                Docker Compose configs
```

---

_Built for learning. Runs on your own hardware._

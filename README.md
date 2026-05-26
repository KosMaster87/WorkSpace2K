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

## Production Deployment

Two deployment options are documented:

| Option      | Guide                                                                              | Use case                                     |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| VPS         | [docs/manuel/03-deployment-vps.md](docs/manuel/03-deployment-vps.md)               | Root server with full router access          |
| Home Server | [docs/manuel/08-deployment-homeserver.md](docs/manuel/08-deployment-homeserver.md) | Home server behind NAT via Cloudflare Tunnel |

**Quick start (both options):**

```bash
git clone https://github.com/KosMaster87/WorkSpace2K.git /opt/workspace2k
cd /opt/workspace2k/docker
cp .env.example .env && nano .env   # set secrets
docker compose up -d --build
```

Requires nginx-proxy-manager on port 80. The frontend maps to **host port 4200** —
configure the NPM proxy host to forward to port `4200`.

---

_Built for learning. Runs on your own hardware._

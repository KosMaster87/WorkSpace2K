# 02 — Lokales Setup

Funktioniert auf Fedora 44, Ubuntu und Debian.

## Voraussetzungen

```bash
node --version   # v18+ (aktuell: v24)
npm --version    # v9+
ng version       # Angular CLI 21+
docker --version # v24+
git --version
```

## Repo klonen

```bash
git clone git@github-kos:KosMaster87/WorkSpace2K.git
# oder via HTTPS:
git clone https://github.com/KosMaster87/WorkSpace2K.git

cd WorkSpace2K
```

## Entwicklung starten

### 1. Nur PostgreSQL via Docker

```bash
cd docker
docker compose -f docker-compose.dev.yml up -d
# PostgreSQL läuft auf localhost:5432
```

### 2. Backend starten

```bash
cd apps/backend
npm install
cp .env.example .env    # Werte anpassen
npm run dev             # ts-node-dev, hot reload
# API läuft auf http://localhost:3000
```

### 3. Frontend starten

```bash
cd apps/frontend
npm install
ng serve
# App läuft auf http://localhost:4200
```

## Umgebungsvariablen Backend (`.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://ws2k:devpassword@localhost:5432/workspace2k_dev
JWT_SECRET=dein-lokaler-secret-32-zeichen-minimum
JWT_EXPIRES_IN=7d
```

## Auf Fedora 44 spezifisch

Docker läuft als `moby-engine` — alles identisch zu Ubuntu/Debian.
SELinux: bei Bind-Mounts `:z` Flag verwenden (→ Homelab Docker Doku).

## Auf Ubuntu / Debian

Docker offiziell installieren:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Alles mit einem Befehl stoppen

```bash
# Frontend: Ctrl+C
# Backend: Ctrl+C
cd docker && docker compose -f docker-compose.dev.yml down
```

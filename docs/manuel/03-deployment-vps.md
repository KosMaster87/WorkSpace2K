# 03 — VPS Deployment (Production)

## Ziel-Setup auf VPS

```
Internet
  ↓ :80/:443
Nginx Proxy Manager (Docker)
  ├── workspace.dev2k.space → WorkSpace2K Frontend
  └── api.dev2k.space       → WorkSpace2K Backend API

WorkSpace2K Frontend  (Docker, Angular gebaut)
WorkSpace2K Backend   (Docker, Express)
PostgreSQL            (Docker, Volume)
```

## Unterstützte Server-OS

| OS            | Getestet | Besonderheit               |
| ------------- | -------- | -------------------------- |
| Ubuntu 22.04+ | ✅       | Empfohlen für VPS          |
| Debian 12     | ✅       | Libre Workspace kompatibel |
| Fedora Server | ✅       | SELinux → `:z` Volumes     |

## Voraussetzungen auf dem VPS

```bash
# Docker installieren (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Auf Fedora
sudo dnf install moby-engine
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

## Deployment

```bash
# Repo auf VPS klonen
git clone https://github.com/KosMaster87/WorkSpace2K.git
cd WorkSpace2K/docker

# .env für Production anlegen
cp .env.example .env
nano .env   # Secrets setzen!

# Alles starten
docker compose up -d
```

## Umgebungsvariablen Production (`.env`)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ws2k:SICHERES_PASSWORT@db:5432/workspace2k
JWT_SECRET=MIN_32_ZEICHEN_ZUFAELLIGER_STRING
JWT_EXPIRES_IN=7d
DB_PASSWORD=SICHERES_DB_PASSWORT
```

Generieren:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 16   # DB_PASSWORD
```

## NPM Proxy Host

> **Port-Hinweis:** Der Frontend-Container mappt Host-Port `4200` → Container-Port `80`.
> NPM muss daher auf Port `4200` weiterleiten, nicht `80`.
> Hintergrund: Port `80` auf dem Host ist durch NPM selbst belegt.

| Feld             | Wert                    |
| ---------------- | ----------------------- |
| Domain Frontend  | `workspace.dev2k.space` |
| Forward Hostname | `localhost`             |
| Forward Port     | `4200`                  |
| SSL              | Let's Encrypt ✅        |

| Feld             | Wert              |
| ---------------- | ----------------- |
| Domain API       | `api.dev2k.space` |
| Forward Hostname | `ws2k-backend`    |
| Forward Port     | `3000`            |
| SSL              | Let's Encrypt ✅  |

## Updates deployen

```bash
git pull origin main
docker compose up -d --build
```

## Empfohlene VPS Hardware

| Anbieter    | Plan            | RAM      | Preis        | Eignung          |
| ----------- | --------------- | -------- | ------------ | ---------------- |
| IONOS       | VPS S (aktuell) | 1 GB     | ~€1/mo       | ❌ zu wenig      |
| IONOS       | VPS L           | 4 GB     | ~€12/mo      | ✅               |
| **Hetzner** | **CAX21**       | **8 GB** | **€8.49/mo** | **✅ Empfohlen** |

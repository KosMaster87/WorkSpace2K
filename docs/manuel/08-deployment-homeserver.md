# 08 — Home-Server Deployment (Cloudflare Tunnel)

## Ziel-Setup

```
Internet
  ↓ HTTPS
Cloudflare (DNS + Proxy + Tunnel-Endpoint)
  ↓ Cloudflare Tunnel (ausgehende Verbindung vom Server)
cloudflared (Daemon auf Home-Server)
  ↓ HTTP intern
nginx-proxy-manager (Port 80, Reverse Proxy)
  ↓ HTTP
WorkSpace2K Frontend (Port 4200 → Container-Port 80)
  ↓ intern via nginx.conf
WorkSpace2K Backend (Port 3000)
PostgreSQL (Port 5432, nur intern)
```

## Warum Cloudflare Tunnel statt Port-Forwarding?

Cloudflare Tunnel funktioniert auch hinter Double-NAT (mehrere Router) und
benötigt keinen Zugriff auf alle Router. Der Server baut eine ausgehende
Verbindung zu Cloudflare auf — keine offenen Ports nötig.

→ Detaillierte Infos: Cloudflare-Doku im Obsidian-Vault

---

## Voraussetzungen

- Fedora Server (oder Ubuntu/Debian) mit Docker installiert
- User mit sudo-Rechten (nicht root direkt)
- Cloudflare-Account + Domain
- nginx-proxy-manager läuft auf Port 80/443/81
- cloudflared-Daemon läuft als Systemdienst

---

## Warum Port 4200 statt 80?

nginx-proxy-manager (NPM) belegt Port 80 auf dem Host.
Das WorkSpace2K Frontend darf **nicht** ebenfalls Port 80 beanspruchen.

```yaml
# docker/docker-compose.yml — Frontend:
ports:
  - '4200:80'   # Host-Port 4200 → Container-Port 80 (nginx)
```

NPM leitet `workspace2k.dev2ksoftware.com` → `localhost:4200` weiter.

---

## Deployment

```bash
# Repo klonen:
git clone https://github.com/KosMaster87/WorkSpace2K.git /opt/workspace2k
cd /opt/workspace2k/docker

# .env anlegen:
cp .env.example .env
nano .env
```

### .env ausfüllen

```env
# Sicheres Datenbankpasswort:
DB_PASSWORD=<openssl rand -hex 16>

# Datenbank-URL — Hostname ist der Docker-Service-Name "db":
DATABASE_URL=postgresql://ws2k:<DB_PASSWORD>@db:5432/workspace2k

# JWT Secret — mindestens 32 Bytes:
JWT_SECRET=<openssl rand -hex 32>

# CORS: URL unter der das Frontend erreichbar ist (kein trailing slash):
CORS_ORIGIN=https://workspace2k.dev2ksoftware.com
```

Secrets generieren:
```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 16   # DB_PASSWORD
```

```bash
# Build + Start:
docker compose up -d --build

# Status prüfen:
docker compose ps
docker compose logs -f
```

---

## Datenbank initialisieren (einmalig)

```bash
# 1. Migrationen anwenden (Tabellen anlegen):
docker compose exec backend npx prisma migrate deploy

# 2. Admin-User + Standard-Destinations anlegen:
docker compose exec backend npm run db:seed:prod
```

> Die Seed-Variablen `SEED_ADMIN_EMAIL` und `SEED_ADMIN_PASSWORD` müssen in der `.env` gesetzt sein.
> Nach dem ersten Login das Passwort ändern — danach können die Variablen aus der `.env` entfernt werden.

> ⚠️ Nach `.env`-Änderungen den Backend-Container neu starten:
> `docker compose up -d backend` — erst dann werden neue Umgebungsvariablen übernommen.

Der Seed legt 9 Standard-Destinations an:
- **Infrastruktur:** Nginx Proxy Manager (`http://192.168.188.24:81`)
- **Security:** Vaultwarden
- **Produktivität:** Nextcloud, Winboard
- **Automation:** n8n
- **DevOps:** Gitea, GitLab
- **Kommunikation:** Element, Jitsi Meet

URLs danach in WorkSpace2K → Destinations anpassen.

---

## NPM Proxy Host konfigurieren

1. NPM Web-UI → `http://<server-ip>:81`
2. **Proxy Hosts → Add Proxy Host**

| Feld             | Wert                            |
| ---------------- | ------------------------------- |
| Domain Names     | `workspace2k.dev2ksoftware.com` |
| Scheme           | `http`                          |
| Forward Hostname | `localhost` oder `192.168.188.24` |
| Forward Port     | `4200`                          |
| Websockets       | ✅                               |

**SSL Tab:**
| Feld            | Wert                  |
| --------------- | --------------------- |
| SSL Certificate | Let's Encrypt (DNS-01) |
| Force SSL       | ❌ (wegen Tunnel — sonst Redirect-Loop) |
| HTTP/2 Support  | ✅                    |

> ⚠️ **Force SSL muss deaktiviert sein** wenn Cloudflare Tunnel verwendet wird.
> Cloudflare erzwingt HTTPS auf Browser-Seite — NPM darf nicht zusätzlich umleiten.

---

## Firewall (Fedora — firewalld)

Bei Cloudflare Tunnel sind keine eingehenden Ports nötig.
Nur für LAN-Zugriff:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Updates einspielen

```bash
cd /opt/workspace2k
git pull origin main
docker compose -f docker/docker-compose.yml up -d --build
```

---

## Dienste verwalten

```bash
# Status:
docker compose -f docker/docker-compose.yml ps

# Logs:
docker compose -f docker/docker-compose.yml logs -f

# Tunnel-Status (systemd):
sudo systemctl status cloudflared

# Tunnel-Status (Docker — wenn migriert):
docker compose -f /opt/stacks/cloudflared/compose.yaml ps

# NPM-Status:
docker compose -f /opt/stacks/npm/compose.yaml ps
```

---

## Cloudflare Tunnel als Docker Stack (optional)

Alle Dienste einheitlich als Docker-Stacks verwalten — sichtbar in WorkSpace2K.

```bash
# Stack-Verzeichnis anlegen:
mkdir -p /opt/stacks/cloudflared
```

Datei `/opt/stacks/cloudflared/compose.yaml`:
```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    volumes:
      - /etc/cloudflared:/etc/cloudflared:ro
    network_mode: host
```

```bash
# systemd-Dienst stoppen:
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared

# Docker-Stack starten:
docker compose -f /opt/stacks/cloudflared/compose.yaml up -d

# Prüfen:
docker compose -f /opt/stacks/cloudflared/compose.yaml logs -f
```

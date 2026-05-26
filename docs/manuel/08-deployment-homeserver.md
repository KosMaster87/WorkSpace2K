# 08 — Home-Server Deployment (Cloudflare Tunnel)

## Ziel-Setup

```
Internet
  ↓ HTTPS
Cloudflare (DNS + Proxy + Tunnel-Endpoint)
  ↓ Cloudflare Tunnel (ausgehende Verbindung vom Server)
cloudflared (Docker-Container in /opt/stacks/cloudflared/)
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

## Server-Verzeichnisstruktur

```
/opt/stacks/
├── workspace2k/     ← Git-Repo geklont hierher — compose.yaml im Root
│   ├── compose.yaml
│   ├── apps/
│   ├── packages/
│   └── ...
├── npm/             ← nginx-proxy-manager Stack
│   └── compose.yaml
└── cloudflared/     ← Cloudflare Tunnel Stack
    └── compose.yaml
```

WorkSpace2K liegt direkt in `/opt/stacks/workspace2k/` — dadurch erscheint
es automatisch als verwaltbarer Stack in der eigenen Services-Seite.

---

## Voraussetzungen

- Fedora Server (oder Ubuntu/Debian) mit Docker installiert
- User mit sudo-Rechten (nicht root direkt)
- Cloudflare-Account + Domain
- nginx-proxy-manager läuft auf Port 80/443/81
- cloudflared läuft als Docker-Stack in `/opt/stacks/cloudflared/`

---

## Warum Port 4200 statt 80?

nginx-proxy-manager (NPM) belegt Port 80 auf dem Host.
Das WorkSpace2K Frontend darf **nicht** ebenfalls Port 80 beanspruchen.

```yaml
# compose.yaml — Frontend:
ports:
  - '4200:80'   # Host-Port 4200 → Container-Port 80 (nginx)
```

NPM leitet `workspace2k.dev2ksoftware.com` → `localhost:4200` weiter.

---

## Deployment

```bash
# Repo direkt nach /opt/stacks/workspace2k/ klonen:
git clone https://github.com/KosMaster87/WorkSpace2K.git /opt/stacks/workspace2k
cd /opt/stacks/workspace2k

# .env anlegen (liegt im Root, gleich wie compose.yaml):
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

# Admin-User für einmalige DB-Initialisierung (Seed):
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<sicheres-passwort>
```

Secrets generieren:
```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 16   # DB_PASSWORD
```

```bash
# Build + Start (compose.yaml liegt im Root):
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

> ⚠️ Nach `.env`-Änderungen Backend neu starten damit neue Variablen übernommen werden:
> `docker compose up -d backend`

Der Seed legt 9 Standard-Destinations an:
- **Infrastruktur:** Nginx Proxy Manager (`http://192.168.188.24:81`)
- **Security:** Vaultwarden
- **Produktivität:** Nextcloud, WinBoat (`https://winboat.app` — externer Web-Emulator)
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

---

## Cloudflare Tunnel als Docker Stack

```bash
mkdir -p /opt/stacks/cloudflared
nano /opt/stacks/cloudflared/compose.yaml
```

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    volumes:
      # :z = SELinux-Relabeling (Pflicht auf Fedora!)
      - /etc/cloudflared:/etc/cloudflared:ro,z
    network_mode: host
```

> ⚠️ **SELinux auf Fedora:** Das `:z` im Volume-Mount ist Pflicht.
> Ohne `:z` → `permission denied` trotz `chmod 644`.
> Zusätzlich: `sudo chmod 644 /etc/cloudflared/<tunnel-uuid>.json`

```bash
docker compose -f /opt/stacks/cloudflared/compose.yaml up -d
docker compose -f /opt/stacks/cloudflared/compose.yaml logs --tail=10
```

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
cd /opt/stacks/workspace2k
git pull origin main
docker compose up -d --build
```

---

## Dienste verwalten

```bash
# WorkSpace2K:
docker compose ps
docker compose logs -f

# Cloudflare Tunnel:
docker compose -f /opt/stacks/cloudflared/compose.yaml ps
docker compose -f /opt/stacks/cloudflared/compose.yaml logs --tail=20

# NPM:
docker compose -f /opt/stacks/npm/compose.yaml ps
```

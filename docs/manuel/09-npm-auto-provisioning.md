# 09 — NPM Auto-Provisioning

## Problem

Bisher muss nach jedem Stack-Start manuell ein Proxy Host in Nginx Proxy Manager
angelegt werden: Subdomain, Forward-Host, Port, SSL-Zertifikat auswählen, Websockets,
Force SSL deaktivieren. Bei 7+ Apps mit teils mehreren Hosts (Matrix: Synapse + Element)
ist das fehleranfällig und für jeden Neukloner eine lange manuelle Anleitung.

---

## Lösung — automatisches Provisioning via API

WorkSpace2K legt NPM Proxy Hosts **automatisch** an wenn ein Stack gestartet wird.
Konfiguration pro Stack in einer `ws2k.json` Sidecar-Datei.

**Graceful Degradation:** Wenn `NPM_EMAIL` oder `NPM_PASSWORD` nicht gesetzt sind,
passiert gar nichts — kein Fehler, kein Lärm. WorkSpace2K funktioniert vollständig
ohne NPM-Integration weiter.

---

## ws2k.json — Sidecar-Datei pro Stack

Jedes Stack-Verzeichnis kann optional eine `ws2k.json` enthalten:

```json
{
  "proxy": [
    { "subdomain": "gitea", "container": "gitea", "port": 3000, "websockets": true }
  ]
}
```

Mehrere Einträge pro Stack werden unterstützt (Beispiel Matrix):

```json
{
  "proxy": [
    { "subdomain": "matrix",  "container": "synapse",  "port": 8008, "websockets": true },
    { "subdomain": "element", "container": "element",  "port": 80,   "websockets": true }
  ]
}
```

### Alle konfigurierten Stacks

| Stack           | Subdomain  | Container        | Port | Websockets |
| --------------- | ---------- | ---------------- | ---- | ---------- |
| gitea           | gitea      | gitea            | 3000 | ✅         |
| vaultwarden     | vaultwarden| vaultwarden      | 80   | ✅         |
| n8n             | n8n        | n8n              | 5678 | ✅         |
| nextcloud       | nextcloud  | nextcloud        | 80   | ❌         |
| gitlab          | gitlab     | gitlab           | 80   | ✅         |
| matrix          | matrix     | synapse          | 8008 | ✅         |
| matrix          | element    | element          | 80   | ✅         |
| obsidian-live…  | obsidian   | obsidian-couchdb | 5984 | ❌         |

`winboat` hat keine `ws2k.json` — WinBoat ist eine externe Web-App (`https://winboat.app`), kein self-hosted Stack.

---

## Aktivierung

### 1. npm_proxy Docker-Netzwerk erstellen (einmalig)

NPM und alle App-Container müssen im selben Docker-Netzwerk sein damit die
Container-Namen als Forward-Host aufgelöst werden:

```bash
docker network create npm_proxy
```

NPM-Container ins Netzwerk aufnehmen:
```bash
docker network connect npm_proxy npm-npm-1
```

NPM `compose.yaml` (`/opt/stacks/npm/compose.yaml`) um das externe Netzwerk erweitern:
```yaml
services:
  npm:
    # ... bestehende Konfiguration ...
    networks:
      - default
      - npm_proxy

networks:
  npm_proxy:
    external: true
```

### 2. App-Stacks: npm_proxy Netzwerk einbinden

Jeder App-Stack muss `npm_proxy` in seiner `compose.yaml` referenzieren damit
NPM den Container-Namen auflösen kann:

```yaml
services:
  gitea:
    # ...
    networks:
      - gitea_default
      - npm_proxy

networks:
  gitea_default:
    driver: bridge
  npm_proxy:
    external: true
```

### 3. Umgebungsvariablen setzen

In `/opt/stacks/workspace2k/.env` ergänzen:

```env
# NPM Auto-Provisioning
NPM_URL=http://host.docker.internal:81
NPM_EMAIL=admin@yourdomain.com
NPM_PASSWORD=dein-npm-passwort
BASE_DOMAIN=yourdomain.com
```

> `host.docker.internal` wird via `extra_hosts: host-gateway` in `compose.yaml`
> auf den Host aufgelöst — so erreicht der Backend-Container NPM auf Port 81.

### 4. Backend neu bauen + starten

```bash
cd /opt/stacks/workspace2k
git pull origin main
docker compose build backend
docker compose up -d --force-recreate backend
```

---

## Technische Umsetzung

### Ablauf beim Stack-Start (`POST /api/docker/stacks/:name/start`)

```
Stack starten (Docker API / docker compose up -d)
  ↓ fire-and-forget (blockiert Response nicht)
composeService.findStack(name)
  ↓
npmService.ensureProxyHosts(stack)
  ├── isNpmConfigured()? → nein → return (still)
  ├── stack.proxy vorhanden? → nein → return (still)
  ├── BASE_DOMAIN gesetzt? → nein → warn + return
  ├── loginNpm() → Bearer-Token (gecacht, 60s Puffer)
  ├── findWildcardCert() → Zertifikat-ID für *.yourdomain.com
  ├── getExistingProxyHosts() → existierende Hosts laden
  └── für jeden proxy-Eintrag:
        ├── FQDN = subdomain.BASE_DOMAIN
        ├── bereits vorhanden? → skip (Idempotenz)
        └── createProxyHost() → POST /api/nginx/proxy-hosts
              └── 401? → Token-Cache leeren + einmaliger Retry
```

Fehler (NPM nicht erreichbar, falsches Passwort etc.) werden **geloggt aber nicht geworfen**
— der Stack-Start ist bereits erfolgreich und der HTTP-Response bereits gesendet.

### Token-Caching

```typescript
let cachedToken: string | undefined;
let tokenExpiresAt: number = 0;
const TOKEN_EXPIRY_BUFFER_MS = 60_000; // 60 Sekunden vor Ablauf neu einloggen
```

Der NPM JWT-Token wird gecacht und wiederverwendet solange er noch mehr als 60 Sekunden
gültig ist. Bei 401-Antwort: Cache leeren + einmaliger Re-Login.

### Proxy Host Einstellungen

```typescript
ssl_forced: 0,          // Force SSL deaktiviert — Cloudflare Tunnel: sonst Redirect-Loop
hsts_enabled: false,    // HSTS deaktiviert — NPM erfordert Force SSL für HSTS
                        // Cloudflare erzwingt HTTPS bereits auf Browser-Ebene
```

> ⚠️ **Force SSL muss deaktiviert sein** bei Cloudflare Tunnel.
> Cloudflare → NPM: HTTP intern. Force SSL → NPM leitet auf HTTPS um → Cloudflare →
> NPM: erneut HTTP → Redirect-Loop. Cloudflare handhabt HTTPS extern.

### Idempotenz

Vor dem Erstellen eines Proxy Hosts werden alle existierenden Hosts geladen und
in einem `Set<string>` gecacht. Bereits vorhandene FQDNs werden übersprungen:

```
[npm] Proxy Host existiert bereits: gitea.yourdomain.com — übersprungen
```

Das bedeutet: mehrfaches Starten desselben Stacks ist sicher.

---

## Logs prüfen

```bash
# NPM Provisioning Log:
docker logs ws2k-backend | grep '\[npm\]'

# Erwartete Ausgabe beim ersten Start:
# [npm] Proxy Host erstellt: gitea.yourdomain.com → gitea:3000

# Erwartete Ausgabe beim zweiten Start (Idempotenz):
# [npm] Proxy Host existiert bereits: gitea.yourdomain.com — übersprungen

# Wenn NPM nicht konfiguriert:
# (kein Output — still übersprungen)

# Wenn BASE_DOMAIN fehlt:
# [npm] BASE_DOMAIN nicht gesetzt — NPM-Provisioning übersprungen
```

---

## Neue Stacks hinzufügen

1. Stack-Verzeichnis anlegen: `stacks/meinapp/`
2. `compose.yaml` erstellen mit `npm_proxy` Netzwerk
3. `ws2k.json` anlegen:
   ```json
   { "proxy": [{ "subdomain": "meinapp", "container": "meinapp", "port": 8080, "websockets": false }] }
   ```
4. Stack in WorkSpace2K starten → Proxy Host wird automatisch angelegt

---

## Wildcard-Zertifikat

NPM sucht beim Provisioning automatisch nach einem Wildcard-Zertifikat für `*.BASE_DOMAIN`.
Wenn vorhanden, wird es dem neuen Proxy Host zugewiesen — HTTPS ohne weitere Konfiguration.

Wildcard-Zertifikat in NPM erstellen:
`SSL Certificates → Add SSL Certificate → Let's Encrypt → *.yourdomain.com`
→ DNS Challenge verwenden (Cloudflare API-Token).

→ Detaillierte Infos: Obsidian-Vault `Cloudflare/docs/manuel/08-wildcard-subdomain.md`

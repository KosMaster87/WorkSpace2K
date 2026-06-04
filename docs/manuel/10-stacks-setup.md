# 10 — Stacks Einrichten (Stack-spezifische Konfiguration)

Jeder Stack wird über WorkSpace2K gestartet. Einige benötigen vorher eine `.env`-Datei
im Stack-Verzeichnis oder einen manuellen Ersteinrichtungsschritt.

---

## Übersicht: Welcher Stack braucht was?

| Stack          | `.env` nötig  | Ersteinrichtung     | URL                                     |
| -------------- | ------------- | ------------------- | --------------------------------------- |
| gitea          | ❌            | Setup-Wizard (Web)  | `https://gitea.dev2ksoftware.com`       |
| vaultwarden    | ❌ (optional) | Registrierung (Web) | `https://vaultwarden.dev2ksoftware.com` |
| n8n            | ✅            | Login (Web)         | `https://n8n.dev2ksoftware.com`         |
| nextcloud      | ✅            | Setup-Wizard (Web)  | `https://nextcloud.dev2ksoftware.com`   |
| gitlab         | ✅            | root-Passwort (Web) | `https://gitlab.dev2ksoftware.com`      |
| matrix         | ✅            | homeserver.yaml     | `https://matrix.dev2ksoftware.com`      |
| obsidian-live… | ❌            | CouchDB-Admin (Web) | `https://obsidian.dev2ksoftware.com`    |
| winboat        | ✅            | noVNC im Browser    | `https://winboat.dev2ksoftware.com`     |

---

## Gitea

**Keine `.env` nötig.** Gitea richtet sich beim ersten Aufruf über einen Web-Wizard ein.

Stack starten → `https://gitea.dev2ksoftware.com` aufrufen → Wizard:

| Feld            | Wert                                |
| --------------- | ----------------------------------- |
| Database Type   | SQLite3 (einfachste Option)         |
| Server Domain   | `gitea.dev2ksoftware.com`           |
| HTTP Port       | `3000`                              |
| Base URL        | `https://gitea.dev2ksoftware.com/`  |
| SSH Server Port | `222` (nicht 22 — Host-Port belegt) |

Admin-User anlegen: kein Leerzeichen im Username (z.B. `dev2k`).

> ⚠️ Nach dem Wizard kann der SSH-Port in `gitea/app.ini` dauerhaft gesetzt werden.

---

## Vaultwarden

**Keine `.env` nötig.** Optional: Admin-Token für das Admin-Panel.

```bash
# Optional — Admin-Panel aktivieren:
echo "ADMIN_TOKEN=$(openssl rand -base64 48)" >> /opt/stacks/workspace2k/stacks/vaultwarden/.env
```

Beim ersten Aufruf von `https://vaultwarden.dev2ksoftware.com`:
→ **„Create Account"** — Account direkt erstellen (kein Setup-Wizard).

> ⚠️ Registrierung ist standardmäßig offen. Nach dem Anlegen des eigenen Accounts
> in der Vaultwarden-Administration unter `Signups Allowed` deaktivieren — oder
> `SIGNUPS_ALLOWED=false` in die `.env` setzen und neu starten.

---

## n8n

**`.env` Pflicht** — ohne `N8N_ENCRYPTION_KEY` startet n8n nicht.

```bash
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" \
  > /opt/stacks/workspace2k/stacks/n8n/.env
```

> ⚠️ Den generierten Key **sicher aufbewahren** (z.B. in Vaultwarden).
> Bei Verlust sind alle gespeicherten Credentials in n8n unlesbar und
> müssen neu angelegt werden.

Stack starten → `https://n8n.dev2ksoftware.com` → ersten Admin-User anlegen.

---

## Nextcloud

**`.env` Pflicht** — Datenbank-Credentials + Admin-User.

`/opt/stacks/workspace2k/stacks/nextcloud/.env` anlegen:

```env
MYSQL_ROOT_PASSWORD=<openssl rand -hex 16>
MYSQL_PASSWORD=<openssl rand -hex 16>
MYSQL_DATABASE=nextcloud
MYSQL_USER=nextcloud
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=<sicheres-passwort>
NEXTCLOUD_TRUSTED_DOMAINS=nextcloud.dev2ksoftware.com
```

Secrets generieren:

```bash
openssl rand -hex 16   # MYSQL_ROOT_PASSWORD
openssl rand -hex 16   # MYSQL_PASSWORD
```

Stack starten → `https://nextcloud.dev2ksoftware.com` → Wizard:
Datenbank-Typ **MySQL/MariaDB** wählen, Werte aus `.env` eintragen.

> ⚠️ Beim ersten Start dauert Nextcloud 1–2 Minuten bis die Datenbank
> initialisiert ist. Seite neu laden falls 502.

---

## GitLab

**`.env` Pflicht** — GitLab CE benötigt einen Host-Pfad für persistente Daten.

`/opt/stacks/workspace2k/stacks/gitlab/.env` anlegen:

```env
GITLAB_HOME=/opt/gitlab
```

Verzeichnis anlegen:

```bash
sudo mkdir -p /opt/gitlab/{config,logs,data}
```

Stack starten (erster Start dauert **3–5 Minuten** — großes Image, Initialisierung).

Root-Passwort auslesen (nach erstem Start):

```bash
docker exec gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

→ `https://gitlab.dev2ksoftware.com` → mit `root` + ausgelesem Passwort einloggen
→ Passwort sofort ändern (initiales Passwort verfällt nach 24h).

> ⚠️ GitLab benötigt ~1 GB RAM. Auf Servern mit wenig RAM: Swap prüfen.
> GitLab-Image ist ~2 GB groß — erster Pull dauert je nach Verbindung 2–10 Minuten.

---

## Matrix (Synapse + Element)

**`.env` + `homeserver.yaml` Pflicht.**

### 1. homeserver.yaml generieren

```bash
mkdir -p /opt/stacks/workspace2k/stacks/matrix/synapse-data
docker run --rm \
  -v /opt/stacks/workspace2k/stacks/matrix/synapse-data:/data \
  matrixdotorg/synapse:latest generate \
  --server-name matrix.dev2ksoftware.com \
  --report-stats no
```

Das erstellt `/opt/stacks/workspace2k/stacks/matrix/synapse-data/homeserver.yaml`.

### 2. `.env` anlegen

```bash
# /opt/stacks/workspace2k/stacks/matrix/.env
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER=synapse
POSTGRES_DB=synapse
```

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER=synapse
POSTGRES_DB=synapse" > /opt/stacks/workspace2k/stacks/matrix/.env
```

### 3. Stack starten

→ `https://matrix.dev2ksoftware.com` — Synapse Admin-API
→ `https://element.dev2ksoftware.com` — Element Web-Client

Admin-User anlegen:

```bash
docker exec synapse register_new_matrix_user \
  -u admin -p <passwort> -a \
  -c /data/homeserver.yaml \
  http://localhost:8008
```

---

## Obsidian LiveSync (CouchDB)

**Keine `.env` nötig.** CouchDB startet mit Default-Credentials.

Stack starten → CouchDB Admin-UI:
`https://obsidian.dev2ksoftware.com/_utils/`

Ersten Admin anlegen:
→ **„Fix this"** Banner oben klicken → Admin-User + Passwort setzen.

In Obsidian LiveSync Plugin:

- Remote URI: `https://obsidian.dev2ksoftware.com`
- User/Password: die oben gesetzten CouchDB-Credentials
- Database: `obsidian` (oder eigener Name)

---

## WinBoat (Windows in Docker)

**`.env` Pflicht** — Windows-Version und Lizenz-Optionen.

```bash
# /opt/stacks/workspace2k/stacks/winboat/.env
VERSION=win11   # win10, win11, win2022, ...
RAM_SIZE=4G
CPU_CORES=2
DISK_SIZE=64G
```

```bash
echo 'VERSION=win11
RAM_SIZE=4G
CPU_CORES=2
DISK_SIZE=64G' > /opt/stacks/workspace2k/stacks/winboat/.env
```

> ⚠️ WinBoat (dockur/windows) benötigt KVM-Virtualisierung.
> Prüfen ob KVM verfügbar ist:
>
> ```bash
> ls /dev/kvm && echo "KVM verfügbar" || echo "KVM fehlt"
> ```
>
> Ohne KVM startet Windows nicht.

Stack starten → `https://winboat.dev2ksoftware.com` → noVNC-Browser-Interface.
Windows-Installation dauert beim ersten Start **10–20 Minuten**.

### Combo: Browser + native Windows-Apps

Für natives Fenster auf dem Host zusätzlich RDP aktivieren:

```env
# .env ergänzen:
RDP_ENABLED=yes
```

Dann mit einem RDP-Client verbinden:

```
Host: <server-ip>
Port: 3389
```

→ noVNC im Browser für schnellen Zugriff, RDP für native App-Fenster.

---

## Alle `.env`-Dateien — Schnellübersicht

```bash
# n8n
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" \
  > /opt/stacks/workspace2k/stacks/n8n/.env

# Nextcloud
cat > /opt/stacks/workspace2k/stacks/nextcloud/.env << EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
MYSQL_PASSWORD=$(openssl rand -hex 16)
MYSQL_DATABASE=nextcloud
MYSQL_USER=nextcloud
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=$(openssl rand -hex 12)
NEXTCLOUD_TRUSTED_DOMAINS=nextcloud.dev2ksoftware.com
EOF

# GitLab
echo "GITLAB_HOME=/opt/gitlab" \
  > /opt/stacks/workspace2k/stacks/gitlab/.env
sudo mkdir -p /opt/gitlab/{config,logs,data}

# Matrix
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_USER=synapse
POSTGRES_DB=synapse" > /opt/stacks/workspace2k/stacks/matrix/.env

# WinBoat
echo 'VERSION=win11
RAM_SIZE=4G
CPU_CORES=2
DISK_SIZE=64G' > /opt/stacks/workspace2k/stacks/winboat/.env
```

> Alle `.env`-Dateien sind in `.gitignore` eingetragen — sie werden **niemals** committed.

---

## NPM Proxy Hosts

NPM Proxy Hosts werden automatisch beim Stack-Start angelegt (→ `09-npm-auto-provisioning.md`).
**WinBoat** ist die einzige Ausnahme — noVNC läuft direkt über einen NPM Proxy Host,
RDP wird direkt über Port 3389 verbunden (kein Reverse Proxy).

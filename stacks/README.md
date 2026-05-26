# Stacks

Compose-Dateien für alle Homelab-Apps. Diese Stacks werden von WorkSpace2K
automatisch erkannt und können über die Services-Seite verwaltet werden.

## Struktur

| Stack              | Beschreibung                                | Port(s)        |
| ------------------ | ------------------------------------------- | -------------- |
| `vaultwarden/`     | Passwort-Manager (Bitwarden-kompatibel)     | via NPM        |
| `gitea/`           | Self-hosted Git                             | 222 (SSH)      |
| `gitlab/`          | Git + CI/CD + Issues                        | 2222 (SSH)     |
| `n8n/`             | Workflow-Automatisierung                    | via NPM        |
| `matrix/`          | Matrix Homeserver (Synapse) + Element Web   | via NPM        |
| `obsidian-livesync/` | CouchDB für Obsidian LiveSync             | via NPM        |
| `winboat/`         | Windows-VM in Docker (dockur/windows)       | 8006, 3389     |
| `nextcloud/`       | Self-hosted Cloud (Dateien, Kalender)       | via NPM        |

## Netzwerk

Alle Stacks die über NPM (nginx-proxy-manager) erreichbar sein sollen,
nutzen das externe Netzwerk `npm_proxy`:

```yaml
networks:
  npm_proxy:
    external: true
```

Das Netzwerk wird vom NPM-Stack erstellt: `/opt/stacks/npm/` → Projekt `npm`
→ Netzwerk `proxy` → Docker-Name: `npm_proxy`.

## Deployment auf dem Server

WorkSpace2K scannt `/opt/stacks/workspace2k/stacks/` automatisch.
Da das Repo nach `/opt/stacks/workspace2k/` geklont wird, sind die Stacks
direkt erreichbar — kein manuelles Kopieren nötig.

```bash
# Stack aktivieren (Beispiel Vaultwarden):
cd /opt/stacks/workspace2k/stacks/vaultwarden
cp ../.env.example .env   # falls .env.example vorhanden
nano .env                  # Secrets eintragen
docker compose up -d

# Oder direkt über WorkSpace2K → Services → + Neuer Stack
```

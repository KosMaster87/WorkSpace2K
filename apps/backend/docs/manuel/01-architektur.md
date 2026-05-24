# 01 — Architektur

## Ordnerstruktur

```
apps/backend/
├── src/
│   ├── index.ts                  # Server-Einstieg — Express App + Middleware
│   ├── controllers/
│   │   └── auth.controller.ts    # Login + Session-Restore Logik
│   ├── middleware/
│   │   └── auth.middleware.ts    # JWT-Prüfung für geschützte Routes
│   ├── routes/
│   │   └── auth.routes.ts        # Route-Definitionen /api/auth/*
│   └── services/
│       └── prisma.service.ts     # Prisma Singleton
├── prisma/
│   ├── schema.prisma             # Datenbankschema (User-Modell)
│   ├── seed.ts                   # Admin-User anlegen
│   └── tsconfig.json             # IDE-tsconfig für seed.ts
├── tsconfig.json                 # Haupt-tsconfig (src/ only)
├── tsconfig.seed.json            # tsconfig für npm run db:seed
└── .env                          # Umgebungsvariablen (nicht versioniert)
```

---

## Tech Stack

| Paket            | Version | Zweck                           |
| ---------------- | ------- | ------------------------------- |
| `express`        | 4.x     | HTTP-Server + Routing           |
| `helmet`         | 7.x     | Security-Header (XSS, CSP, ...) |
| `cors`           | 2.x     | CORS für Angular Dev-Server     |
| `jsonwebtoken`   | 9.x     | JWT erstellen + verifizieren    |
| `bcryptjs`       | 2.x     | Passwort-Hashing                |
| `@prisma/client` | 5.x     | Typsicherer Datenbank-Client    |
| `dotenv`         | 16.x    | `.env`-Datei laden              |
| `ts-node-dev`    | 2.x     | Dev-Server mit Hot Reload       |

---

## .env — Umgebungsvariablen

```env
# Datenbankverbindung (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/workspace2k"

# JWT
JWT_SECRET="openssl rand -hex 32 ausführen und Ergebnis eintragen"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
CORS_ORIGIN="http://localhost:4200"
```

> `.env` ist in `.gitignore` — **nie committen**.
> Für Production: Umgebungsvariablen direkt im System/Docker setzen.

---

## tsconfig-Struktur

```
tsconfig.json          → Haupt-Config, nur src/**/*
tsconfig.seed.json     → für prisma/seed.ts (rootDir: ".", types: ["node"])
prisma/tsconfig.json   → IDE-Config (VS Code sieht seed.ts korrekt)
```

**Warum zwei tsconfigs?**
`tsconfig.json` hat `rootDir: ./src` → Dateien außerhalb von `src/` werden abgelehnt.
`prisma/seed.ts` liegt außerhalb → braucht eigene Config mit `rootDir: "."`.

```bash
# Seed-Script nutzt explizit tsconfig.seed.json:
npm run db:seed
# → ts-node-dev --project tsconfig.seed.json --transpile-only prisma/seed.ts
```

---

## Server starten

```bash
# Development (Hot Reload)
npm run dev       # ts-node-dev src/index.ts

# Production Build
npm run build     # tsc → dist/
npm start         # node dist/index.js
```

→ Weiter: [02-api-auth.md](02-api-auth.md)

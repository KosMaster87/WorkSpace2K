# 03 — Prisma & Datenbank

Prisma ist der ORM (Object-Relational Mapper) für PostgreSQL.
Er generiert aus dem Schema einen typsicheren TypeScript-Client.

---

## Schema — `prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(cuid())  // CUID — kollisionsfreie ID
  email     String   @unique               // eindeutig — kein Duplikat möglich
  name      String
  password  String                         // bcrypt-Hash — nie Plaintext!
  role      Role     @default(USER)        // USER oder ADMIN
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt            // automatisch bei jedem Update

  @@map("users")                           // Tabelle heißt "users" (nicht "User")
}

enum Role {
  ADMIN
  USER
}
```

### Felder im Detail

| Feld        | Typ        | Besonderheit                             |
| ----------- | ---------- | ---------------------------------------- |
| `id`        | `String`   | `cuid()` — zufällige, einzigartige ID    |
| `email`     | `String`   | `@unique` — DB-Index, kein Duplikat      |
| `password`  | `String`   | bcrypt-Hash (12 Rounds) — nie Plaintext  |
| `role`      | `Role`     | Enum: `ADMIN` \| `USER`, Default: `USER` |
| `createdAt` | `DateTime` | automatisch beim Erstellen gesetzt       |
| `updatedAt` | `DateTime` | automatisch bei jedem `update()` gesetzt |

---

## Prisma Client — Singleton

`src/services/prisma.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

**Warum Singleton?** Jede `new PrismaClient()` öffnet einen neuen Connection Pool.
Zu viele Instanzen → zu viele DB-Verbindungen → Performance-Probleme.
Die eine exportierte Instanz wird von allen Modulen geteilt.

---

## Wichtige Prisma-Befehle

```bash
# Lokale Entwicklung

# Migration erstellen + anwenden (nach Schema-Änderung):
npx prisma migrate dev --name "beschreibung-der-änderung"

# Prisma Client neu generieren (nach Schema-Änderung):
npx prisma generate

# Datenbank im Browser anschauen:
npx prisma studio

# Admin-User anlegen (Seed):
npm run db:seed
```

```bash
# Production

# Nur Migrationen anwenden (kein Client-Generate, kein Reset):
npx prisma migrate deploy
```

---

## Seed — Admin-User anlegen

`prisma/seed.ts` legt den ersten Admin-User an.
Das Script ist **idempotent** — läuft es mehrfach, passiert nichts:

```typescript
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log('✓ Admin-User existiert bereits — übersprungen.');
  return;
}
```

### Seed ausführen

Zuerst in `.env` setzen:

```env
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=dein-sicheres-passwort
```

Dann:

```bash
npm run db:seed
```

Legt an:
- **E-Mail:** aus `SEED_ADMIN_EMAIL`
- **Passwort:** aus `SEED_ADMIN_PASSWORD` (wird mit bcrypt 12 Rounds gehasht)
- **Rolle:** `ADMIN`

> ⚠️ Credentials **nie** im Code hardcoden — immer aus `.env` lesen.
> Passwort nach dem ersten Login in der App ändern.

### Warum eigene tsconfig?

`seed.ts` liegt in `prisma/`, nicht in `src/`.
Die Haupt-`tsconfig.json` hat `rootDir: ./src` — Dateien außerhalb werden abgelehnt.

```bash
# Das Script nutzt tsconfig.seed.json (rootDir: ".", types: ["node"]):
ts-node-dev --project tsconfig.seed.json --transpile-only prisma/seed.ts
```

---

## Migrations-Workflow

```
Schema ändern (schema.prisma)
  │
  ▼
npx prisma migrate dev --name "was-sich-geändert-hat"
  │
  ├── erstellt SQL-Migration in prisma/migrations/
  ├── wendet Migration auf lokale DB an
  └── generiert Prisma Client neu (types aktuell)
```

Migration-Dateien **werden versioniert** (in git) — so kann jede Umgebung
reproduzierbar auf den gleichen DB-Stand gebracht werden.

```bash
# Neuer Server / CI / Production:
npx prisma migrate deploy   # wendet alle noch nicht angewandten Migrations an
```

---

## Passwort-Hashing mit bcrypt

```typescript
// Beim Seed / User-Anlegen:
const hash = await bcrypt.hash('••••••••', 12);
//                                              ↑ 12 Rounds = gutes Sicherheitsniveau
//                                              (10 = Standard, 14 = sehr sicher aber langsam)

// Beim Login — Vergleich:
const match = await bcrypt.compare(password, user.password);
// → true wenn Passwort stimmt, false wenn nicht
// Wichtig: nie Hashes direkt vergleichen (===) — immer bcrypt.compare()
```

→ Zurück zum Index: [index.md](index.md)

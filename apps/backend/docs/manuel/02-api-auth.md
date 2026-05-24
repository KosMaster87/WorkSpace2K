# 02 — API: Auth-Endpunkte

Alle Auth-Routes liegen unter `/api/auth`.
Registriert in `src/routes/auth.routes.ts`, eingehängt in `src/index.ts`.

---

## Endpunkte Übersicht

| Method | Pfad              | Auth nötig? | Controller |
| ------ | ----------------- | ----------- | ---------- |
| POST   | `/api/auth/login` | ❌ offen    | `login()`  |
| GET    | `/api/auth/me`    | ✅ JWT      | `getMe()`  |
| GET    | `/api/health`     | ❌ offen    | inline     |

---

## POST `/api/auth/login`

Authentifiziert einen User mit E-Mail und Passwort.

### Request

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "••••••••"
}
```

### Response — Erfolg (200)

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxxxxx",
      "email": "admin@example.com",
      "name": "Dev2K Admin",
      "role": "admin"
    }
  }
}
```

> `role` wird **lowercase** zurückgegeben (`admin` / `user`) —
> Prisma speichert `ADMIN` / `USER`, der Controller konvertiert mit `.toLowerCase()`.

### Response — Fehler

```json
// 400 — fehlende Felder
{ "message": "Email and password required" }

// 401 — falsche Credentials
{ "message": "Invalid credentials" }
```

> **Security:** Gleiche Fehlermeldung für "User nicht gefunden" und "Passwort falsch".
> Verhindert User-Enumeration (Angreifer kann nicht wissen ob E-Mail existiert).

### Ablauf intern

```
POST /api/auth/login
  → login() in auth.controller.ts
    1. email + password aus req.body lesen
    2. prisma.user.findUnique({ where: { email } })
    3. bcrypt.compare(password, user.password)
    4. jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
    5. { data: { token, user } } zurückgeben
```

---

## GET `/api/auth/me`

Gibt den aktuell eingeloggten User zurück und stellt einen frischen Token aus.
Wird von `restoreSession()` im Frontend beim App-Start aufgerufen.

### Request

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response — Erfolg (200)

```json
{
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "clxxxxxx",
      "email": "admin@example.com",
      "name": "Dev2K Admin",
      "role": "admin"
    }
  }
}
```

> Der zurückgegebene Token ist **neu signiert** (Token-Rotation) —
> verlängert die Session automatisch bei aktivem Nutzen der App.

### Response — Fehler

```json
// 401 — kein / ungültiger / abgelaufener Token
{ "message": "Unauthorized" }
{ "message": "Invalid token" }

// 404 — Token gültig aber User in DB gelöscht
{ "message": "User not found" }
```

---

## Auth Middleware — `authMiddleware`

`src/middleware/auth.middleware.ts` — schützt alle Routen wo sie eingehängt ist.

```typescript
// In auth.routes.ts:
authRouter.get('/me', authMiddleware, getMe);
//                    ↑ läuft vor getMe — prüft JWT
```

### Was die Middleware macht

```
Request kommt an
  → Header: "Authorization: Bearer <token>"
  │
  ├── kein Header oder falsches Format → 401 Unauthorized
  │
  └── Token vorhanden
        → jwt.verify(token, JWT_SECRET)
        │
        ├── ungültig / abgelaufen → 401 Invalid token
        │
        └── gültig
              → req.userId = payload.userId
              → req.userRole = payload.role
              → next()  ← Controller wird aufgerufen
```

### `AuthRequest` Interface

```typescript
// Erweitert Express Request um Auth-Felder:
interface AuthRequest extends Request {
  userId?: string; // gesetzt nach authMiddleware
  userRole?: string; // 'ADMIN' | 'USER'
}
```

---

## Response-Format

Alle Erfolgs-Antworten folgen dem `ApiResponse`-Format aus `@dev2k/shared`:

```json
{
  "data": { ... }
}
```

Fehler-Antworten haben kein `data`-Wrapper:

```json
{
  "message": "Fehlerbeschreibung"
}
```

> Das Frontend-`AuthService` erwartet dieses Format und mapped `res.data` auf den internen Typen.

→ Weiter: [03-prisma-datenbank.md](03-prisma-datenbank.md)

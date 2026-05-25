# TECH-DEBT.md

Technische Schulden und bekannte Architektur-Lücken im WorkSpace2K-Monorepo.

---

## TD-001 — `@workspace2k/shared` nicht in Frontend-Build importierbar

**Status:** offen  
**Priorität:** mittel  
**Bereich:** Frontend / tsconfig  
**Entdeckt:** 2026-05-25  

### Problem

Das `@workspace2k/shared`-Package existiert, um Typen zwischen Frontend und Backend zu teilen.
Der Path-Alias ist korrekt in `apps/frontend/tsconfig.json` konfiguriert:

```json
"paths": {
  "@workspace2k/shared": ["../../packages/shared/src"],
  "@workspace2k/shared/*": ["../../packages/shared/src/*"]
}
```

`npm run typecheck` (`tsc --noEmit` gegen die Root-tsconfig) funktioniert problemlos.

**`ng build` schlägt jedoch fehl**, weil der Angular-Build `tsconfig.app.json` verwendet,
das `"rootDir": "./src"` setzt. TypeScript erlaubt dann keine Imports aus Dateien außerhalb
von `./src` — und `../../packages/shared/src/index.ts` verletzt diesen Check:

```
error TS6059: File '...packages/shared/src/index.ts' is not under 'rootDir'
'...apps/frontend/src'.
```

### Auswirkung

Typen werden dreifach definiert statt einmal aus `@workspace2k/shared` zu importieren:

| Ort | Typ | Entspricht |
|-----|-----|------------|
| `packages/shared/service.model.ts` | `DockerService` | Quelle der Wahrheit |
| `apps/backend/src/services/docker.service.ts` | `DockerContainerInfo` | lokale Kopie |
| `apps/frontend/src/app/store/docker/docker.state.ts` | `Container` | lokale Kopie |

Gleiches gilt für `ServiceStatus` (dreifach) und `User` (zweifach: shared + `auth.state.ts`).

### Ursache

`tsconfig.app.json` erbt von `tsconfig.json`, überschreibt aber `rootDir`:

```jsonc
// apps/frontend/tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "rootDir": "./src",   // ← blockiert Imports aus ../../packages/
    "types": []
  }
}
```

### Lösung

`rootDir` aus `tsconfig.app.json` entfernen — TypeScript inferiert es dann selbst
aus allen eingebundenen Dateien (schließt `packages/shared/src/` ein):

```jsonc
// apps/frontend/tsconfig.app.json — nach Fix
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    // rootDir entfernt
    "types": []
  }
}
```

Danach können alle lokalen Typ-Kopien durch direkte Imports ersetzt werden:

```typescript
// vorher (lokal)
import { Container, ServiceStatus } from '../../store/docker/docker.state';

// nachher (shared)
import { DockerService, ServiceStatus } from '@workspace2k/shared';
```

### Risiko beim Fix

Das Entfernen von `rootDir` ändert die Verzeichnisstruktur des `outDir`-Outputs
(`out-tsc/app/`). Das betrifft nur den Intermediate-Build-Output, nicht das finale
`dist/`-Verzeichnis — sollte daher unkritisch sein, muss aber verifiziert werden.

### Schritte für den Fix

1. `rootDir` aus `apps/frontend/tsconfig.app.json` entfernen
2. `ng build` testen — Build muss durchlaufen
3. `npm run typecheck` testen — weiterhin grün
4. Lokale Typ-Kopien in `docker.state.ts` und `auth.state.ts` durch Shared-Imports ersetzen
5. Backend analog prüfen (`apps/backend/tsconfig.json` hat ebenfalls `rootDir: ./src`)

---

## TD-002 — Backend: `DockerContainerInfo` lokal statt aus `@workspace2k/shared`

**Status:** offen  
**Priorität:** mittel  
**Bereich:** Backend / tsconfig  
**Entdeckt:** 2026-05-25  
**Verwandt:** TD-001

### Problem

Identische Ursache wie TD-001 — `apps/backend/tsconfig.json` hat `"rootDir": "./src"`.
`DockerContainerInfo` und `ServiceStatus` in `docker.service.ts` sind lokale Kopien
der `DockerService`- und `ServiceStatus`-Typen aus `@workspace2k/shared`.

### Lösung

Analog zu TD-001: `rootDir` aus Backend-tsconfig entfernen, dann Shared-Imports nutzen.
Erst TD-001 lösen, dann TD-002.

---

## Wie neue Tech-Debt eintragen

```markdown
## TD-XXX — Kurztitel

**Status:** offen | in Arbeit | erledigt
**Priorität:** hoch | mittel | niedrig
**Bereich:** Frontend | Backend | Shared | Infra | CI
**Entdeckt:** YYYY-MM-DD

### Problem
...

### Lösung
...
```

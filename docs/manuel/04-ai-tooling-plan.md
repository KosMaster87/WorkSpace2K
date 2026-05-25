# AI-Tooling — Senior Team Setup

Dreistufiger Plan um professionelle KI-Automatisierung in WorkSpace2K zu integrieren.
Angelehnt an das Setup aus dem KI-Coding-Mastery Kurs (Mario Link Shortener).

---

## Stufe 1 — Lokal: Claude Code Hooks ✅

**Kein Secret nötig. Wirkt sofort.**

Projekt-weite `settings.json` mit automatischen Hooks:

| Hook                          | Trigger                  | Aktion               |
| ----------------------------- | ------------------------ | -------------------- |
| `PostToolUse` → `Edit\|Write` | Nach jeder Dateiänderung | Prettier auto-format |
| `PostToolUse` → `Bash`        | Nach jedem Shell-Command | Lint silent          |
| `PreToolUse` → `Bash`         | Vor jedem Shell-Command  | `rm -rf` blockieren  |

**Dateien:**

- `.claude/settings.json` — Hooks für alle Team-Mitglieder (ins Repo)

---

## Stufe 2 — GitHub: Dependabot + Auto-Merge 📝 geplant

**Kein Secret nötig.**

| Was                            | Datei                                         |
| ------------------------------ | --------------------------------------------- |
| Dependabot Konfiguration       | `.github/dependabot.yml` ✅ erstellt          |
| Auto-Merge für sichere Updates | `.github/workflows/dependabot-auto-merge.yml` |
| GitHub Labels anlegen          | `dependencies`, `frontend`, `backend`, `ci`   |

**Auto-Merge-Logik:**

- GitHub Actions patch + minor → automatisch
- npm dev-deps patch + minor → automatisch
- npm prod-deps patch → automatisch
- alles andere (major, prod minor) → manuell prüfen

---

## Stufe 3 — PR-Review-Bot: Claude API 📝 geplant

**Braucht `ANTHROPIC_API_KEY` als GitHub Secret.**

Bei jedem PR postet ein Bot automatisch ein Code-Review als Kommentar:

```
### Summary
Kurze Beschreibung was der PR macht.

### Findings
- High: auth.guard.ts – fehlende Null-Prüfung
- Low: login.ts – doppelter Code

### Test-Gaps
- Kein Test für Token-Ablauf
```

| Was           | Datei                                               |
| ------------- | --------------------------------------------------- |
| Review-Script | `scripts/pr-review.ts` (TypeScript, Angular-Prompt) |
| Workflow      | `.github/workflows/pr-review.yml`                   |
| Secret        | `ANTHROPIC_API_KEY` in GitHub Repo Settings         |

**Prompt angepasst auf:** Angular 21, NgRx 19, Vitest, Express, Prisma.

---

## Referenz

- Vorlage: `~/SynologyDrive/dev2k-Javascript/Mario-Link-Shortener/KI-Coding-Mastery/link-shortener/`
- Docs: `Dev2K-Modules/.github/docs/ai/README.md`

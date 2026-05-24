# 01 — Architektur

## Ordnerstruktur

```
src/app/
├── core/                        # Singletons — einmal, global
│   ├── guards/                  # authGuard, guestGuard, adminGuard
│   ├── interceptors/            # authInterceptor (JWT Header)
│   └── services/                # AuthService, ...
├── layout/                      # App-Shell Komponenten
│   ├── app-shell/               # Shell-Wrapper (Sidebar + Header + RouterOutlet)
│   ├── sidebar/                 # Seitennavigation
│   └── header/                  # Topbar
├── features/                    # Lazy-loaded Pages
│   ├── dashboard/
│   ├── login/
│   ├── services/
│   ├── settings/
│   └── users/
├── shared/                      # Wiederverwendbar überall
│   ├── components/
│   ├── pipes/
│   └── directives/
└── store/                       # NgRx State
    ├── auth/                    # NgRx Store (global, async)
    │   ├── auth.actions.ts
    │   ├── auth.effects.ts
    │   ├── auth.reducer.ts
    │   ├── auth.selectors.ts
    │   └── auth.state.ts
    └── app/                     # NgRx Signal Store (UI-State)
        └── app.store.ts
```

## Konventionen

| Was          | Convention                                                                |
| ------------ | ------------------------------------------------------------------------- |
| Komponenten  | Standalone (Standard seit Angular 17 — kein `standalone: true` nötig)     |
| Selektoren   | `selectXxx` Präfix                                                        |
| Actions      | `createActionGroup` mit `source: 'Feature'`                               |
| Guards       | Functional (`CanActivateFn`)                                              |
| Interceptors | Functional (`HttpInterceptorFn`)                                          |
| Effects      | Functional (`createEffect(..., { functional: true })`)                    |
| SCSS         | BEM, nur `@dev2k/scss-library` Tokens (liegt in `packages/scss-library/`) |

## Proxy-Konfiguration (Dev-Modus)

Im Development-Modus läuft das Frontend auf Port **4200**, das Backend auf Port **3000**.
Ohne Proxy würde der Browser `/api/auth/login` auf `localhost:4200` suchen → 404.

```json
// proxy.conf.json (im frontend/-Ordner)
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

```json
// angular.json — im "serve" > "options" Block:
"proxyConfig": "proxy.conf.json"
```

Der Angular Dev-Server leitet alle `/api/*`-Anfragen an `localhost:3000` weiter.
Im Production-Build übernimmt das **Nginx Proxy Manager** — kein Proxy-File nötig.

---

## Wann NgRx Store vs. Signal Store?

| NgRx Store (`@ngrx/store`) | Signal Store (`@ngrx/signals`) |
| -------------------------- | ------------------------------ |
| Globaler, async State      | Lokaler, sync UI-State         |
| Auth, API-Daten            | Theme, Sidebar, PageTitle      |
| Braucht Effects            | Kein Effect nötig              |
| DevTools integriert        | Einfacher, weniger Boilerplate |

# 03 — NgRx State Management

## Auth Store (NgRx Store)

Für async State der von der API kommt.

### Actions

```typescript
// Auslösen:
this.store.dispatch(AuthActions.login({ email, password }));
this.store.dispatch(AuthActions.logout());

// Selektieren (Signal):
readonly user = this.store.selectSignal(selectUser);
readonly isAuth = this.store.selectSignal(selectIsAuthenticated);
```

### State-Flow

```
Component → dispatch(AuthActions.login)
  → Effect: AuthService.login()
    → Success → dispatch(AuthActions.loginSuccess)
      → Reducer: state.user = user, state.token = token
      → Effect: localStorage.setItem + router.navigate('/dashboard')
    → Failure → dispatch(AuthActions.loginFailure)
      → Reducer: state.error = message
```

## App Store (NgRx Signal Store)

Für synchronen UI-State ohne API-Calls.

```typescript
// Injizieren:
readonly appStore = inject(AppStore);

// Lesen (Signals — reaktiv):
appStore.theme()              // 'dark' | 'light'
appStore.sidebarCollapsed()   // boolean
appStore.pageTitle()          // string

// Schreiben (Methods):
appStore.toggleTheme()
appStore.toggleSidebar()
appStore.setPageTitle('Dashboard')
appStore.restoreTheme()       // aus localStorage beim App-Start
```

## State-Restore beim App-Start

`app.ts` → `ngOnInit()`:
1. `appStore.restoreTheme()` — setzt data-theme auf `<html>` aus localStorage
2. `store.dispatch(AuthActions.restoreSession())` — prüft JWT Token im localStorage

## DevTools

Redux DevTools Extension im Browser installieren → alle Actions + State-Änderungen live.
Nur im Development-Mode aktiv (`isDevMode()`).

# 04 — Route Guards

## Übersicht

| Guard | Schützt | Redirect bei Fail |
|-------|---------|------------------|
| `authGuard` | Eingeloggte Bereiche | → `/login` |
| `guestGuard` | `/login` | → `/dashboard` (wenn schon eingeloggt) |
| `adminGuard` | Admin-Only Routen | → `/dashboard` |

## Verwendung in Routes

```typescript
// app.routes.ts
{
  path: 'login',
  canActivate: [guestGuard],          // nur für nicht-eingeloggte
  loadComponent: () => import('./features/login/login')
},
{
  path: '',
  component: AppShellComponent,
  canActivate: [authGuard],           // gesamte Shell geschützt
  children: [
    {
      path: 'settings',
      canActivate: [adminGuard],      // zusätzlich Admin-only
      loadComponent: () => import('./features/settings/settings')
    }
  ]
}
```

## Wie Guards funktionieren (Functional)

```typescript
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),                                        // einmalig lesen
    map(isAuth => isAuth || router.createUrlTree(['/login']))
    //            ^true    ^UrlTree = Redirect
  );
};
```

`take(1)` — wichtig! Ohne es würde der Guard auf jeden State-Update reagieren
und nie abschließen.

## Guard-Kette

Mehrere Guards auf einer Route werden nacheinander ausgeführt.
Schlägt einer fehl → Redirect, die anderen werden nicht mehr geprüft.

```typescript
canActivate: [authGuard, adminGuard]
// Erst auth prüfen, dann admin
```

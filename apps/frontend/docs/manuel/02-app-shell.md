# 02 — App Shell (Layout)

Die App Shell ist das Haupt-Layout für alle eingeloggten Bereiche.
Sie besteht aus drei Komponenten: `AppShellComponent`, `SidebarComponent`, `HeaderComponent`.

---

## Layout-Struktur

```
AppShellComponent  (app-shell.ts)
├── SidebarComponent  (links)   — Navigation, User-Info, Logout
├── HeaderComponent   (oben)    — Seitentitel, Theme-Toggle
└── <router-outlet>             — Inhalt der aktiven Route
```

---

## AppShellComponent

`layout/app-shell/app-shell.ts` — reine Layout-Komponente, keine Logik.

```typescript
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app-shell.html',
})
export class AppShellComponent {}
```

Wird in `app.routes.ts` als Parent-Route verwendet — alle geschützten Routen
sind Children davon:

```typescript
{
  path: '',
  component: AppShellComponent,
  canActivate: [authGuard],   // gesamte Shell geschützt
  children: [
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard') },
    { path: 'settings', canActivate: [adminGuard], ... },
    ...
  ]
}
```

---

## SidebarComponent

`layout/sidebar/sidebar.ts` — Navigation + Logout.

### Nav-Items

```typescript
readonly navItems: NavItem[] = [
  { label: 'Dashboard',  icon: '⊞',  route: '/dashboard' },
  { label: 'Services',   icon: '⚙',  route: '/services' },
  { label: 'Docker',     icon: '🐳', route: '/docker' },
  { label: 'Monitoring', icon: '📊', route: '/monitoring' },
  { label: 'Backups',    icon: '💾', route: '/backups' },
  { label: 'Settings',   icon: '⚡', route: '/settings', adminOnly: true },
  { label: 'Users',      icon: '👥', route: '/users',    adminOnly: true },
];
```

`adminOnly: true` → im Template nur sichtbar wenn `user()?.role === 'admin'`.

### Sidebar einklappen

```typescript
// Sidebar-Status aus AppStore (Signal Store)
readonly appStore = inject(AppStore);

appStore.sidebarCollapsed()  // boolean — reaktives Signal
appStore.toggleSidebar()     // Sidebar ein-/ausklappen
```

### Logout

```typescript
logout(): void {
  this.store.dispatch(AuthActions.logout());
}
// → logoutEffect: localStorage.removeItem('ws2k_token') + router.navigate(['/login'])
```

### User-Info

```typescript
// Zeigt Name und Rolle im Sidebar-Footer
readonly user = this.store.selectSignal(selectUser);
// im Template: {{ user()?.name }} · {{ user()?.role }}
```

---

## HeaderComponent

`layout/header/header.ts` — Seitentitel + Theme-Toggle.

```typescript
readonly appStore = inject(AppStore);

// Template bindet direkt:
appStore.pageTitle()      // string — dynamisch, von Feature-Komponenten gesetzt
appStore.theme()          // 'dark' | 'light'
appStore.toggleTheme()    // wechselt Theme + speichert in localStorage
```

### Seitentitel setzen

Feature-Komponenten setzen den Titel beim Start:

```typescript
// z.B. in dashboard.ts ngOnInit():
this.appStore.setPageTitle('Dashboard');
```

---

## Zusammenhang App Shell ↔ Store

```
AppShellComponent
  │
  ├── SidebarComponent
  │     ├── inject(Store)     → selectUser (NgRx Auth Store)
  │     │                        Logout → dispatch(AuthActions.logout())
  │     └── inject(AppStore)  → sidebarCollapsed, toggleSidebar (Signal Store)
  │
  └── HeaderComponent
        └── inject(AppStore)  → pageTitle, theme, toggleTheme (Signal Store)
```

→ Weiter: [03-ngrx.md](03-ngrx.md)

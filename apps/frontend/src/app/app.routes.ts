/**
 * @fileoverview Angular Application Routes — Routing-Konfiguration
 * @description Definiert alle Routen der Applikation.
 *   Alle Feature-Komponenten sind lazy-loaded (loadComponent).
 *   Geschützte Routen liegen unter AppShellComponent (authGuard).
 *   /login ist nur für nicht-eingeloggte User (guestGuard).
 *   /settings und /users sind nur für Admins (adminGuard).
 * @module AppRoutes
 */

import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AppShellComponent } from './layout/app-shell/app-shell';

/**
 * Applikations-Routen.
 * @description Route-Struktur:
 *   - /login → LoginComponent (guestGuard: nur für nicht-eingeloggte)
 *   - / → AppShellComponent (authGuard: nur für eingeloggte)
 *     - /dashboard, /services → öffentlich (für alle eingeloggten User)
 *     - /settings, /users → adminGuard (nur ADMIN-Rolle)
 *   - ** → redirect zu /login
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'docker',
        loadComponent: () =>
          import('./features/services/services').then((m) => m.ServicesComponent),
      },
      {
        path: 'destinations',
        loadComponent: () =>
          import('./features/destinations/destinations').then((m) => m.DestinationsComponent),
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users').then((m) => m.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AppShellComponent } from './layout/app-shell/app-shell';

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
        path: 'services',
        loadComponent: () =>
          import('./features/services/services').then((m) => m.ServicesComponent),
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

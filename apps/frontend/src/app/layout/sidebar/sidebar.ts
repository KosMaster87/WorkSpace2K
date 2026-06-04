/**
 * @fileoverview Sidebar Component — Seitliche Navigation
 * @description Zeigt Navigationslinks, User-Info und Logout-Button.
 *   Filtert Admin-only Nav-Items basierend auf der User-Rolle.
 *   Logout dispatcht AuthActions.logout → logoutEffect löscht Token und navigiert zu /login.
 * @module SidebarComponent
 */

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectUser } from '../../store/auth/auth.selectors';

/**
 * Navigations-Item in der Sidebar.
 * @interface NavItem
 */
interface NavItem {
  /** Anzeigename des Nav-Items. */
  label: string;
  /** Icon-Zeichen oder Emoji. */
  icon: string;
  /** Router-Pfad für RouterLink. */
  route: string;
  /** Wenn true: Item nur für ADMIN-User sichtbar. */
  adminOnly?: boolean;
}

/**
 * Seitliche Navigationsleiste der App-Shell.
 * @description NavItems sind statisch definiert — Admin-only Items werden im Template gefiltert.
 *   user-Signal für User-Info (Name, Rolle) im Footer der Sidebar.
 * @class SidebarComponent
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private readonly store = inject(Store);

  /** AppStore-Instanz — für Template-Zugriff auf toggleSidebar und sidebarCollapsed. */
  readonly appStore = inject(AppStore);

  /** Signal: Aktuell eingeloggter User (für Anzeige in der Sidebar). */
  readonly user = this.store.selectSignal(selectUser);

  /** Alle Navigations-Items — Admin-only Items im Template via adminOnly filtern. */
  readonly navItems: NavItem[] = [
    { label: 'Destinations', icon: '🔗', route: '/destinations' },
    { label: 'Services', icon: '🐳', route: '/docker' },
    { label: 'Services Overview', icon: '⊞', route: '/dashboard' },
    { label: 'Monitoring', icon: '📊', route: '/monitoring' },
    { label: 'Backups', icon: '💾', route: '/backups' },
    { label: 'Settings', icon: '⚡', route: '/settings', adminOnly: true },
    { label: 'Users', icon: '👥', route: '/users', adminOnly: true },
  ];

  /**
   * Dispatcht Logout-Action.
   * @description logoutEffect übernimmt: localStorage leeren + Navigation zu /login.
   * @returns {void}
   */
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

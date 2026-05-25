/**
 * @fileoverview Root Application Component — App-Einstiegspunkt
 * @description Bootstrapped-Komponente. Initialisiert Theme-Wiederherstellung aus
 *   localStorage und löst Session Restore aus (JWT aus localStorage → GET /api/auth/me).
 *   Enthält nur RouterOutlet — Layout liegt in AppShellComponent.
 * @module App
 */

import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from './store/auth/auth.actions';
import { AppStore } from './store/app/app.store';

/**
 * Root-Komponente der Applikation.
 * @description Startet beim App-Start zwei Initialisierungen:
 *   1. Theme aus localStorage wiederherstellen (synchron via AppStore)
 *   2. Session Restore dispatchen → restoreSessionEffect prüft Token via API
 * @class App
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly appStore = inject(AppStore);
  private readonly store = inject(Store);

  /**
   * Initialisiert Theme und Session beim App-Start.
   * @description restoreSession dispatcht GET /api/auth/me mit gespeichertem Token.
   *   Bei 401 (kein Token) → restoreSessionFailure → Auth-State leer → authGuard → /login.
   *   Bei Erfolg → restoreSessionSuccess → User eingeloggt → /dashboard.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.restoreTheme();
    this.appStore.restoreDockerView();
    this.store.dispatch(AuthActions.restoreSession());
  }
}

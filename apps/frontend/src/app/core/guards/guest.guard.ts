/**
 * @fileoverview Guest Guard — Routen-Schutz für nicht-eingeloggte User
 * @description Verhindert, dass bereits eingeloggte User die Login-Seite aufrufen.
 *   Leitet authentifizierte User zu /dashboard weiter.
 *   Wartet auf selectAuthResolved = true — damit beim Seiten-Refresh der Session Restore
 *   abgeschlossen ist bevor die Routing-Entscheidung getroffen wird.
 * @module GuestGuard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import { selectAuthResolved, selectIsAuthenticated } from '../../store/auth/auth.selectors';

/**
 * Guard der nur nicht-eingeloggten Usern Zugriff gewährt (z.B. /login).
 * @description Wartet bis selectAuthResolved = true (Session Restore abgeschlossen),
 *   dann prüft selectIsAuthenticated einmalig (take(1)).
 *   Bei authentifiziert: UrlTree zu /dashboard → verhindert doppelten Login.
 *   Bei nicht-authentifiziert: true → Navigation wird fortgesetzt.
 * @type {CanActivateFn}
 * @returns {Observable<boolean | UrlTree>} true oder UrlTree zu /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const store: Store = inject(Store);
  const router: Router = inject(Router);

  return combineLatest([
    store.select(selectAuthResolved),
    store.select(selectIsAuthenticated),
  ]).pipe(
    filter(([resolved]) => resolved),
    take(1),
    map(([, isAuth]) => !isAuth || router.createUrlTree(['/dashboard'])),
  );
};

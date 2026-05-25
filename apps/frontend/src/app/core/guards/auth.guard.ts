/**
 * @fileoverview Auth Guard — Routen-Schutz für eingeloggte User
 * @description Verhindert den Zugriff auf geschützte Routen wenn kein Token im Store.
 *   Leitet nicht-authentifizierte User zu /login weiter.
 *   Wartet auf selectAuthResolved = true — damit beim Seiten-Refresh der Session Restore
 *   abgeschlossen ist bevor die Routing-Entscheidung getroffen wird.
 * @module AuthGuard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import { selectAuthResolved, selectIsAuthenticated } from '../../store/auth/auth.selectors';

/**
 * Guard der nur eingeloggten Usern Zugriff gewährt.
 * @description Wartet bis selectAuthResolved = true (Session Restore abgeschlossen),
 *   dann prüft selectIsAuthenticated einmalig (take(1)).
 *   Bei nicht-authentifiziert: UrlTree zu /login → Router führt Redirect durch.
 *   Bei authentifiziert: true → Navigation wird fortgesetzt.
 *   Durch das Warten auf isResolved wird der Logout-Flash beim Seiten-Refresh vermieden.
 * @type {CanActivateFn}
 * @returns {Observable<boolean | UrlTree>} true oder UrlTree zu /login.
 */
export const authGuard: CanActivateFn = () => {
  const store: Store = inject(Store);
  const router: Router = inject(Router);

  return combineLatest([
    store.select(selectAuthResolved),
    store.select(selectIsAuthenticated),
  ]).pipe(
    filter(([resolved]) => resolved),
    take(1),
    map(([, isAuth]) => isAuth || router.createUrlTree(['/login'])),
  );
};

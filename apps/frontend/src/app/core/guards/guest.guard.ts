/**
 * @fileoverview Guest Guard — Routen-Schutz für nicht-eingeloggte User
 * @description Verhindert, dass bereits eingeloggte User die Login-Seite aufrufen.
 *   Leitet authentifizierte User zu /dashboard weiter.
 * @module GuestGuard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

/**
 * Guard der nur nicht-eingeloggten Usern Zugriff gewährt (z.B. /login).
 * @description Liest selectIsAuthenticated aus dem NgRx Store (einmalig via take(1)).
 *   Bei authentifiziert: UrlTree zu /dashboard → verhindert doppelten Login.
 *   Bei nicht-authentifiziert: true → Navigation wird fortgesetzt.
 * @type {CanActivateFn}
 * @returns {Observable<boolean | UrlTree>} true oder UrlTree zu /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const store: Store = inject(Store);
  const router: Router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuth: boolean) => !isAuth || router.createUrlTree(['/dashboard'])),
  );
};

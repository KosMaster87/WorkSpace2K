/**
 * @fileoverview Auth Guard — Routen-Schutz für eingeloggte User
 * @description Verhindert den Zugriff auf geschützte Routen wenn kein Token im Store.
 *   Leitet nicht-authentifizierte User zu /login weiter.
 * @module AuthGuard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

/**
 * Guard der nur eingeloggten Usern Zugriff gewährt.
 * @description Liest selectIsAuthenticated aus dem NgRx Store (einmalig via take(1)).
 *   Bei nicht-authentifiziert: UrlTree zu /login → Router führt Redirect durch.
 *   Bei authentifiziert: true → Navigation wird fortgesetzt.
 * @type {CanActivateFn}
 * @returns {Observable<boolean | UrlTree>} true oder UrlTree zu /login.
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuth) => isAuth || router.createUrlTree(['/login'])),
  );
};

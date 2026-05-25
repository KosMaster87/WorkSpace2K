/**
 * @fileoverview Admin Guard — Routen-Schutz für ADMIN-Rolle
 * @description Verhindert den Zugriff auf Admin-Routen (/settings, /users)
 *   wenn der eingeloggte User keine ADMIN-Rolle hat.
 *   Leitet nicht-autorisierte User zu /dashboard weiter.
 * @module AdminGuard
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsAdmin } from '../../store/auth/auth.selectors';

/**
 * Guard der nur Usern mit ADMIN-Rolle Zugriff gewährt.
 * @description Liest selectIsAdmin aus dem NgRx Store (einmalig via take(1)).
 *   Bei nicht-Admin: UrlTree zu /dashboard → User bleibt in der App, sieht aber keine Admin-Seiten.
 *   Bei Admin: true → Navigation wird fortgesetzt.
 * @type {CanActivateFn}
 * @returns {Observable<boolean | UrlTree>} true oder UrlTree zu /dashboard.
 */
export const adminGuard: CanActivateFn = () => {
  const store: Store = inject(Store);
  const router: Router = inject(Router);

  return store.select(selectIsAdmin).pipe(
    take(1),
    map((isAdmin: boolean) => isAdmin || router.createUrlTree(['/dashboard'])),
  );
};

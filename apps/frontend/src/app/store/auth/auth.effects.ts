/**
 * @fileoverview Auth Effects — Asynchrone Side Effects für den Auth-Flow
 * @description Alle NgRx Effects für Auth-Actions. Jeder Effect ist funktional (kein Klassen-Decorator).
 *   Effects übernehmen: API-Kommunikation, Token-Persistenz (localStorage) und Navigation.
 *   Die Komponenten und der Reducer bleiben dadurch rein — keine Side Effects dort.
 * @module AuthEffects
 */

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthActions } from './auth.actions';
import { User } from './auth.state';

/**
 * Sendet Login-Request an die API und dispatcht Erfolg oder Fehler.
 * @description switchMap bricht vorherige Requests ab bei erneutem Login-Versuch.
 *   Bei Erfolg → loginSuccessEffect übernimmt Token-Speicherung + Navigation.
 *   Bei Fehler → loginFailure setzt error im State → Login-Page zeigt Fehlermeldung.
 * @returns {Observable<Action>} loginSuccess oder loginFailure.
 */
export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }: { email: string; password: string }) =>
        authService.login(email, password).pipe(
          map(({ user, token }: { user: User; token: string }) =>
            AuthActions.loginSuccess({ user, token }),
          ),
          catchError((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Login fehlgeschlagen';
            return of(AuthActions.loginFailure({ error: message }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Speichert Token in localStorage und navigiert nach erfolgreichem Login zu /dashboard.
 * @description dispatch: false — dieser Effect dispatcht keine weitere Action.
 *   Token-Schlüssel: 'ws2k_token' (konsistent mit restoreSessionEffect).
 * @returns {Observable<never>} Kein Dispatch.
 */
export const loginSuccessEffect = createEffect(
  (actions$ = inject(Actions), router: Router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ token }: { token: string }) => localStorage.setItem('ws2k_token', token)),
      tap(() => void router.navigate(['/destinations'])),
    ),
  { functional: true, dispatch: false },
);

/**
 * Löscht Token aus localStorage und navigiert nach Logout zu /login.
 * @description dispatch: false — dieser Effect dispatcht keine weitere Action.
 * @returns {Observable<never>} Kein Dispatch.
 */
export const logoutEffect = createEffect(
  (actions$ = inject(Actions), router: Router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => localStorage.removeItem('ws2k_token')),
      tap(() => void router.navigate(['/login'])),
    ),
  { functional: true, dispatch: false },
);

/**
 * Stellt Session aus gespeichertem Token wieder her.
 * @description Wird von restoreSession ausgelöst (app.ts ngOnInit).
 *   Der authInterceptor hängt den Token aus dem Store an — beim ersten App-Load
 *   ist der Store leer, daher liest der Interceptor null und sendet keinen Header.
 *   Das Backend gibt 401 → catchError → restoreSessionFailure → initialAuthState → /login.
 * @returns {Observable<Action>} restoreSessionSuccess oder restoreSessionFailure.
 */
export const restoreSessionEffect = createEffect(
  (actions$ = inject(Actions), authService: AuthService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() =>
        authService.restoreSession().pipe(
          map(({ user, token }: { user: User; token: string }) =>
            AuthActions.restoreSessionSuccess({ user, token }),
          ),
          catchError(() => of(AuthActions.restoreSessionFailure())),
        ),
      ),
    ),
  { functional: true },
);

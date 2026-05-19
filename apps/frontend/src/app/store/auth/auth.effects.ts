import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthActions } from './auth.actions';

export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        authService.login(email, password).pipe(
          map(({ user, token }) => AuthActions.loginSuccess({ user, token })),
          catchError((err) => of(AuthActions.loginFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const loginSuccessEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ token }) => localStorage.setItem('ws2k_token', token)),
      tap(() => router.navigate(['/dashboard'])),
    ),
  { functional: true, dispatch: false },
);

export const logoutEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => localStorage.removeItem('ws2k_token')),
      tap(() => router.navigate(['/login'])),
    ),
  { functional: true, dispatch: false },
);

export const restoreSessionEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() =>
        authService.restoreSession().pipe(
          map(({ user, token }) => AuthActions.restoreSessionSuccess({ user, token })),
          catchError(() => of(AuthActions.restoreSessionFailure())),
        ),
      ),
    ),
  { functional: true },
);

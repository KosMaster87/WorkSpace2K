/**
 * @fileoverview Users Effects — Asynchrone Side Effects für User-Management
 * @description Alle NgRx Effects für Users-Actions. Funktional (kein Klassen-Decorator).
 * @module UsersEffects
 */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { User } from '@workspace2k/shared';
import { catchError, map, of, switchMap } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { UsersActions } from './users.actions';

/**
 * Lädt alle User und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} loadUsersSuccess oder loadUsersFailure.
 */
export const loadUsersEffect = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(() =>
        userService.getUsers().pipe(
          map((users: User[]) => UsersActions.loadUsersSuccess({ users })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'User konnten nicht geladen werden';
            return of(UsersActions.loadUsersFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Legt einen neuen User an und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} createUserSuccess oder createUserFailure.
 */
export const createUserEffect = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.createUser),
      switchMap(({ payload }) =>
        userService.createUser(payload).pipe(
          map((user: User) => UsersActions.createUserSuccess({ user })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'User konnte nicht angelegt werden';
            return of(UsersActions.createUserFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Ändert die Rolle eines Users und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} updateUserRoleSuccess oder updateUserRoleFailure.
 */
export const updateUserRoleEffect = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.updateUserRole),
      switchMap(({ id, role }) =>
        userService.updateUserRole(id, role).pipe(
          map((user: User) => UsersActions.updateUserRoleSuccess({ user })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'Rolle konnte nicht geändert werden';
            return of(UsersActions.updateUserRoleFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Löscht einen User und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} deleteUserSuccess oder deleteUserFailure.
 */
export const deleteUserEffect = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.deleteUser),
      switchMap(({ id }) =>
        userService.deleteUser(id).pipe(
          map(() => UsersActions.deleteUserSuccess({ id })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'User konnte nicht gelöscht werden';
            return of(UsersActions.deleteUserFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

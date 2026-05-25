/**
 * @fileoverview Auth Reducer — Zustandsübergänge für den Auth-Store
 * @description Pure Funktion die den Auth-State basierend auf dispatched Actions aktualisiert.
 *   Behandelt Login-Zyklus (start → success/failure) und Session Restore.
 *   Logout setzt den State vollständig auf initialAuthState zurück.
 * @module AuthReducer
 */

import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState, User } from './auth.state';

/**
 * Auth-Reducer — verarbeitet alle Auth-Actions und gibt neuen State zurück.
 * @description Zustandsübergänge:
 *   - login → isLoading: true, error: null
 *   - loginSuccess → user + token gesetzt, isLoading: false
 *   - loginFailure → error gesetzt, isLoading: false
 *   - logout → State komplett zurückgesetzt (initialAuthState)
 *   - restoreSessionSuccess → user + token gesetzt (kein isLoading — läuft im Hintergrund)
 *   - restoreSessionFailure → State komplett zurückgesetzt (initialAuthState)
 */
export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state: AuthState) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(
    AuthActions.loginSuccess,
    (state: AuthState, { user, token }: { user: User; token: string }) => ({
      ...state,
      user,
      token,
      isLoading: false,
      error: null,
    }),
  ),

  on(AuthActions.loginFailure, (state: AuthState, { error }: { error: string }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(AuthActions.logout, () => initialAuthState),

  on(
    AuthActions.restoreSessionSuccess,
    (state: AuthState, { user, token }: { user: User; token: string }) => ({
      ...state,
      user,
      token,
    }),
  ),

  on(AuthActions.restoreSessionFailure, () => initialAuthState),
);

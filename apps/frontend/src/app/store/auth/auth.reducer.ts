/**
 * @fileoverview Auth Reducer — Zustandsübergänge für den Auth-Store
 * @description Pure Funktion die den Auth-State basierend auf dispatched Actions aktualisiert.
 *   Behandelt Login-Zyklus (start → success/failure) und Session Restore.
 *   Logout setzt den State vollständig auf initialAuthState zurück — isResolved bleibt true,
 *   damit Guards nach einem Logout nicht erneut auf Session Restore warten.
 * @module AuthReducer
 */

import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState, User } from './auth.state';

/**
 * Auth-Reducer — verarbeitet alle Auth-Actions und gibt neuen State zurück.
 * @description Zustandsübergänge:
 *   - login → isLoading: true, error: null
 *   - loginSuccess → user + token gesetzt, isLoading: false, isResolved: true
 *   - loginFailure → error gesetzt, isLoading: false
 *   - logout → State auf initialAuthState + isResolved: true (Guards nicht blockieren)
 *   - restoreSessionSuccess → user + token gesetzt, isResolved: true
 *   - restoreSessionFailure → State auf initialAuthState + isResolved: true
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
      isResolved: true,
    }),
  ),

  on(AuthActions.loginFailure, (state: AuthState, { error }: { error: string }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Logout: alles zurücksetzen, aber isResolved auf true lassen —
  // sonst würden Guards nach dem Logout auf einen neuen Session Restore warten.
  on(AuthActions.logout, () => ({ ...initialAuthState, isResolved: true })),

  on(
    AuthActions.restoreSessionSuccess,
    (state: AuthState, { user, token }: { user: User; token: string }) => ({
      ...state,
      user,
      token,
      isResolved: true,
    }),
  ),

  // restoreSessionFailure: Auth-State leeren, aber isResolved auf true setzen —
  // Guards sehen: Session Restore ist fertig, kein Token → Weiterleitung zu /login.
  on(AuthActions.restoreSessionFailure, () => ({ ...initialAuthState, isResolved: true })),
);

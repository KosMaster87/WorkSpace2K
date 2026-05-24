/**
 * @fileoverview Auth Actions — NgRx Action-Definitionen für den Auth-Flow
 * @description Alle Actions des Auth-Feature-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via AuthActions.login, AuthActions.loginSuccess etc.
 *   Actions werden von Komponenten (dispatch) und Effects (ofType) genutzt.
 * @module AuthActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from './auth.state';

/**
 * Auth Action Group — alle Auth-bezogenen Actions.
 * @description Actions und ihre Props:
 *   - login: E-Mail + Passwort → Effect sendet API-Request
 *   - loginSuccess: User + Token → Reducer setzt State, Effect speichert Token
 *   - loginFailure: Fehlermeldung → Reducer setzt error im State
 *   - logout: keine Props → Effect löscht Token, navigiert zu /login
 *   - restoreSession: keine Props → Effect prüft Token via GET /api/auth/me
 *   - restoreSessionSuccess: User + Token → Reducer setzt State
 *   - restoreSessionFailure: keine Props → Reducer setzt State auf initial (leer)
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ user: User; token: string }>(),
    'Login Failure': props<{ error: string }>(),
    Logout: emptyProps(),
    'Restore Session': emptyProps(),
    'Restore Session Success': props<{ user: User; token: string }>(),
    'Restore Session Failure': emptyProps(),
  },
});

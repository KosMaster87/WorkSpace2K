/**
 * @fileoverview Auth State — NgRx Auth-Store Typen und Initialzustand
 * @description Definiert den Typ des Auth-State und den Initialzustand.
 *   User und UserRole werden aus @workspace2k/shared importiert und re-exportiert —
 *   möglich seit rootDir aus tsconfig.app.json entfernt wurde (TD-001 gelöst).
 *   auth.actions.ts und auth.effects.ts importieren User weiterhin von hier.
 *
 *   isResolved: false beim App-Start — wird auf true gesetzt sobald restoreSession
 *   abgeschlossen ist (Erfolg oder Fehler). Guards warten auf isResolved = true,
 *   damit die Routing-Entscheidung nicht vor dem Session Restore getroffen wird.
 * @module AuthState
 */

import { User, UserRole } from '@workspace2k/shared';

// Re-Export — auth.actions.ts und auth.effects.ts importieren User von hier
export type { User, UserRole };

/**
 * Vollständiger Auth-State im NgRx Store.
 * @interface AuthState
 */
export interface AuthState {
  /** Eingeloggter User oder null wenn nicht authentifiziert. */
  user: User | null;
  /** JWT-Token oder null wenn nicht authentifiziert. */
  token: string | null;
  /** true während Login oder Session Restore läuft. */
  isLoading: boolean;
  /** Fehlermeldung vom letzten fehlgeschlagenen Login oder null. */
  error: string | null;
  /**
   * true sobald der initiale Session-Restore-Versuch abgeschlossen ist.
   * Guards warten auf diesen Flag bevor sie die Auth-Entscheidung treffen —
   * verhindert Logout-Flash beim Seiten-Refresh.
   */
  isResolved: boolean;
}

/**
 * Initialzustand des Auth-Store — nicht authentifiziert, Session noch nicht geprüft.
 */
export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isResolved: false,
};

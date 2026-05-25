/**
 * @fileoverview Auth State — NgRx Auth-Store Typen und Initialzustand
 * @description Definiert den Typ des Auth-State und den Initialzustand.
 *   User und UserRole werden aus @workspace2k/shared importiert und re-exportiert —
 *   möglich seit rootDir aus tsconfig.app.json entfernt wurde (TD-001 gelöst).
 *   auth.actions.ts und auth.effects.ts importieren User weiterhin von hier.
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
}

/**
 * Initialzustand des Auth-Store — nicht authentifiziert, kein Fehler.
 */
export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

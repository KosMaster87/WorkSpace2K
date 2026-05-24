/**
 * @fileoverview Auth State — NgRx Auth-Store Typen und Initialzustand
 * @description Definiert den Typ des Auth-State und den Initialzustand.
 *   User-Interface wird auch im shared-Package gespiegelt — hier die Frontend-lokale Version.
 * @module AuthState
 */

/**
 * Repräsentiert einen eingeloggten User im Frontend-State.
 * @interface User
 */
export interface User {
  /** Eindeutige User-ID (CUID aus der Datenbank). */
  id: string;
  /** E-Mail-Adresse des Users. */
  email: string;
  /** Anzeigename des Users. */
  name: string;
  /** Rolle des Users — bestimmt Zugriff auf Admin-Routen. */
  role: 'admin' | 'user';
  /** Optionaler Avatar-URL. */
  avatar?: string;
}

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

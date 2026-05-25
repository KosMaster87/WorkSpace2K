/**
 * @fileoverview Users State — NgRx Users-Store Typen und Initialzustand
 * @description Verwaltet die User-Liste, Lade- und Fehlerzustand sowie
 *   pendingIds für laufende Role-Change und Delete-Operationen.
 * @module UsersState
 */

import { User } from '@workspace2k/shared';

export type { User };

/**
 * Vollständiger Users-State im NgRx Store.
 * @interface UsersState
 */
export interface UsersState {
  /** Liste aller User aus der Datenbank. */
  users: User[];
  /** true während GET /api/users läuft. */
  isLoading: boolean;
  /** true während POST /api/users läuft. */
  isCreating: boolean;
  /** IDs von Usern bei denen gerade Role-Change oder Delete läuft. */
  pendingIds: string[];
  /** Fehlermeldung des letzten fehlgeschlagenen Requests oder null. */
  error: string | null;
}

/**
 * Initialzustand des Users-Store.
 */
export const initialUsersState: UsersState = {
  users: [],
  isLoading: false,
  isCreating: false,
  pendingIds: [],
  error: null,
};

/**
 * @fileoverview Destinations State — NgRx Destinations-Store Typen und Initialzustand
 * @description Verwaltet die Destinations-Liste, Lade- und Fehlerzustand sowie
 *   pendingIds für laufende Update/Delete-Operationen.
 *   isCreating steuert den Submit-Button beim Anlegen.
 * @module DestinationsState
 */

import { Destination } from '@workspace2k/shared';

export type { Destination };

/**
 * Vollständiger Destinations-State im NgRx Store.
 * @interface DestinationsState
 */
export interface DestinationsState {
  /** Liste aller aktiven Destinations aus der Datenbank. */
  destinations: Destination[];
  /** true während GET /api/destinations läuft. */
  isLoading: boolean;
  /** true während POST /api/destinations läuft. */
  isCreating: boolean;
  /** IDs von Destinations bei denen gerade Update oder Delete läuft. */
  pendingIds: string[];
  /** Fehlermeldung des letzten fehlgeschlagenen Requests oder null. */
  error: string | null;
}

/**
 * Initialzustand des Destinations-Store.
 */
export const initialDestinationsState: DestinationsState = {
  destinations: [],
  isLoading: false,
  isCreating: false,
  pendingIds: [],
  error: null,
};

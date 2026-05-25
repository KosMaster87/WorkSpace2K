/**
 * @fileoverview Destinations Selectors — Memoized Selektoren für den Destinations-Store
 * @description Alle Selektoren für den destinations-Feature-State.
 *   selectGroupedDestinations gruppiert die Destinations nach category
 *   für die Kachel-Ansicht auf der Destinations-Page.
 * @module DestinationsSelectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DestinationsState } from './destinations.state';

const selectDestinationsState = createFeatureSelector<DestinationsState>('destinations');

/**
 * Gibt alle Destinations zurück (inkl. inaktiver, für Admin-Verwaltung).
 * @returns {Destination[]}
 */
export const selectAllDestinations = createSelector(selectDestinationsState, (s) => s.destinations);

/**
 * Gibt true zurück während die Destinations-Liste geladen wird.
 * @returns {boolean}
 */
export const selectDestinationsLoading = createSelector(
  selectDestinationsState,
  (s) => s.isLoading,
);

/**
 * Gibt true zurück während eine neue Destination angelegt wird.
 * @returns {boolean}
 */
export const selectDestinationsCreating = createSelector(
  selectDestinationsState,
  (s) => s.isCreating,
);

/**
 * Gibt die IDs der Destinations zurück bei denen gerade Update oder Delete läuft.
 * @returns {string[]}
 */
export const selectDestinationsPendingIds = createSelector(
  selectDestinationsState,
  (s) => s.pendingIds,
);

/**
 * Gibt die aktuelle Fehlermeldung zurück oder null.
 * @returns {string | null}
 */
export const selectDestinationsError = createSelector(selectDestinationsState, (s) => s.error);

/**
 * Gibt die Destinations gruppiert nach category zurück.
 * @description Destinations ohne category werden unter 'Sonstige' zusammengefasst.
 *   Sortierung innerhalb jeder Gruppe: sortOrder aufsteigend, dann name.
 * @returns {{ category: string; items: Destination[] }[]}
 */
export const selectGroupedDestinations = createSelector(selectAllDestinations, (destinations) => {
  const groups = new Map<string, typeof destinations>();

  for (const d of destinations) {
    const cat = d.category ?? 'Sonstige';
    if (!groups.has(cat)) {
      groups.set(cat, []);
    }
    groups.get(cat)!.push(d);
  }

  return [...groups.entries()].map(([category, items]) => ({ category, items }));
});

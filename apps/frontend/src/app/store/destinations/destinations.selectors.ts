/**
 * @fileoverview Destinations Selectors — Memoized Selektoren für den Destinations-Store
 * @description Alle Selektoren für den destinations-Feature-State.
 *   selectGroupedDestinations gruppiert die Destinations nach category
 *   für die Kachel-Ansicht auf der Destinations-Page.
 * @module DestinationsSelectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Destination, ServiceStatus } from '@workspace2k/shared';
import { selectAllContainers } from '../docker/docker.selectors';
import { DestinationsState } from './destinations.state';

/**
 * Extrahiert den ersten Subdomain-Teil einer URL als möglichen Container-Namen.
 * @description `https://gitea.dev2ksoftware.com` → `gitea`
 *   Gibt null zurück wenn URL ungültig oder keine Subdomain vorhanden.
 * @param {string} url - Destination-URL.
 * @returns {string | null}
 * @private
 */
function extractContainerName(url: string): string | null {
  try {
    const parts = new URL(url).hostname.split('.');
    return parts.length > 2 ? (parts[0] ?? null) : null;
  } catch {
    return null;
  }
}

/** Destination angereichert mit dem Live-Status des zugehörigen Containers. */
export interface DestinationWithStatus extends Destination {
  /** Status des Containers dessen Name zur Subdomain passt — null wenn kein Match. */
  containerStatus: ServiceStatus | null;
}

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
/**
 * Gibt Destinations angereichert mit dem Live-Status des zugehörigen Containers zurück.
 * @description Matched die erste Subdomain der Destination-URL gegen Container-Namen.
 *   Beispiel: `https://gitea.dev2ksoftware.com` → Container `gitea`.
 *   Kein Match → containerStatus: null (Destination hat keinen bekannten Container).
 * @returns {DestinationWithStatus[]}
 */
export const selectDestinationsWithStatus = createSelector(
  selectAllDestinations,
  selectAllContainers,
  (destinations, containers): DestinationWithStatus[] => {
    const byName = new Map(containers.map((c) => [c.name, c.status]));
    return destinations.map((d) => ({
      ...d,
      containerStatus: byName.get(extractContainerName(d.url) ?? '') ?? null,
    }));
  },
);

/**
 * Gibt die Destinations gruppiert nach category zurück — mit Container-Status.
 * @description Destinations ohne category werden unter 'Sonstige' zusammengefasst.
 *   Sortierung innerhalb jeder Gruppe: sortOrder aufsteigend, dann name.
 * @returns {{ category: string; items: DestinationWithStatus[] }[]}
 */
export const selectGroupedDestinations = createSelector(
  selectDestinationsWithStatus,
  (destinations) => {
    const groups = new Map<string, DestinationWithStatus[]>();

    for (const d of destinations) {
      const cat = d.category ?? 'Sonstige';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(d);
    }

    return [...groups.entries()].map(([category, items]) => ({ category, items }));
  },
);

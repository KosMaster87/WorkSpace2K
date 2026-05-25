/**
 * @fileoverview Docker Selectors — Memoized Selektoren für den Docker-Store
 * @description Alle Selektoren für den docker-Feature-State.
 *   Genutzt in DashboardComponent und ServicesComponent via store.selectSignal().
 * @module DockerSelectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DockerState } from './docker.state';

/**
 * Feature-Selektor — liest den gesamten docker-State aus dem Store.
 * @description Feature-Key muss mit dem Key in provideStore() übereinstimmen: 'docker'.
 */
const selectDockerState = createFeatureSelector<DockerState>('docker');

/**
 * Gibt die vollständige Container-Liste zurück.
 * @returns {Container[]} Alle bekannten Container.
 */
export const selectAllContainers = createSelector(selectDockerState, (state) => state.containers);

/**
 * Gibt true zurück während die Container-Liste geladen wird.
 * @returns {boolean}
 */
export const selectDockerLoading = createSelector(selectDockerState, (state) => state.isLoading);

/**
 * Gibt die aktuelle Fehlermeldung zurück oder null.
 * @returns {string | null}
 */
export const selectDockerError = createSelector(selectDockerState, (state) => state.error);

/**
 * Gibt die IDs der Container zurück, bei denen gerade ein Start/Stop läuft.
 * @returns {string[]} Liste der ausstehenden Container-IDs.
 */
export const selectPendingIds = createSelector(selectDockerState, (state) => state.pendingIds);

/**
 * Gibt die Anzahl der laufenden Container zurück.
 * @returns {number}
 */
export const selectRunningCount = createSelector(
  selectAllContainers,
  (containers) => containers.filter((c) => c.status === 'running').length,
);

/**
 * Gibt die Anzahl der gestoppten Container zurück.
 * @returns {number}
 */
export const selectStoppedCount = createSelector(
  selectAllContainers,
  (containers) => containers.filter((c) => c.status === 'stopped').length,
);

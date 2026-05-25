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
 * @returns {DockerService[]} Alle bekannten Container.
 */
export const selectAllContainers = createSelector(selectDockerState, (state) => state.containers);

/**
 * Gibt den gesamten Stats-Record zurück (id → ContainerStats).
 * @returns {Record<string, ContainerStats>}
 */
export const selectAllStats = createSelector(selectDockerState, (state) => state.stats);

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

/**
 * Gibt den gesamten Logs-Record zurück (id → string[]).
 * @returns {Record<string, string[]>}
 */
export const selectAllLogs = createSelector(selectDockerState, (state) => state.logs);

/**
 * Gibt die IDs der Container zurück, bei denen gerade Logs geladen werden.
 * @returns {string[]}
 */
export const selectLogsPendingIds = createSelector(
  selectDockerState,
  (state) => state.logsPendingIds,
);

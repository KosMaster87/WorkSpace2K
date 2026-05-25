/**
 * @fileoverview Docker Reducer — State-Übergänge für Docker-Actions
 * @description Verarbeitet alle Docker-Actions und erzeugt den neuen State.
 *   Kein Seiteneffekt hier — nur pure Funktion (alter State + Action → neuer State).
 *   Stats: loadContainerStatsSuccess fügt Stats per ID in stats-Record ein.
 *   pendingIds: beim Start/Stop-Request hinzugefügt, bei Success/Failure entfernt.
 * @module DockerReducer
 */

import { createReducer, on } from '@ngrx/store';
import { DockerActions } from './docker.actions';
import { DockerState, initialDockerState } from './docker.state';

/**
 * Docker Feature Reducer.
 * @description Reagiert auf alle DockerActions und gibt den neuen State zurück.
 */
export const dockerReducer = createReducer<DockerState>(
  initialDockerState,

  // ── Container-Liste laden ──────────────────────────────────────────────
  on(DockerActions.loadContainers, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(DockerActions.loadContainersSuccess, (state, { containers }) => ({
    ...state,
    containers,
    isLoading: false,
  })),

  on(DockerActions.loadContainersFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // ── Container-Stats ────────────────────────────────────────────────────
  on(DockerActions.loadContainerStatsSuccess, (state, { id, stats }) => ({
    ...state,
    stats: { ...state.stats, [id]: stats },
  })),

  // loadContainerStats und loadContainerStatsFailure: kein State-Update nötig
  // (Stats-Fehler werden still ignoriert — kein Error-Banner für Stats)

  // ── Container starten ─────────────────────────────────────────────────
  on(DockerActions.startContainer, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
  })),

  on(DockerActions.startContainerSuccess, (state, { id }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    containers: state.containers.map((c) =>
      c.id === id ? { ...c, status: 'running' as const } : c,
    ),
  })),

  on(DockerActions.startContainerFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),

  // ── Container stoppen ─────────────────────────────────────────────────
  on(DockerActions.stopContainer, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
  })),

  on(DockerActions.stopContainerSuccess, (state, { id }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    containers: state.containers.map((c) =>
      c.id === id ? { ...c, status: 'stopped' as const } : c,
    ),
  })),

  on(DockerActions.stopContainerFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),
);

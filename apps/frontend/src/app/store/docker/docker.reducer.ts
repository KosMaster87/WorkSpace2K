/**
 * @fileoverview Docker Reducer — State-Übergänge für Docker-Actions
 * @description Verarbeitet alle Docker-Actions und erzeugt den neuen State.
 *   Kein Seiteneffekt hier — nur pure Funktion (alter State + Action → neuer State).
 *   Stats: loadContainerStatsSuccess fügt Stats per ID in stats-Record ein.
 *   pendingIds: beim Start/Stop-Request hinzugefügt, bei Success/Failure entfernt.
 *
 *   Polling-Optimierung: loadContainersSuccess, loadStacksSuccess und
 *   scanComposeStacksSuccess geben bei unverändertem Inhalt dieselbe State-Referenz
 *   zurück. NgRx-Selektoren emittieren nur bei Referenzänderung — so lösen
 *   periodische Polls keine unnötigen Component-Re-renders aus.
 * @module DockerReducer
 */

import { createReducer, on } from '@ngrx/store';
import { ComposeStack, DockerService, DockerStack } from './docker.state';
import { DockerActions } from './docker.actions';
import { DockerState, initialDockerState } from './docker.state';

/**
 * Prüft ob zwei Container-Listen inhaltlich gleich sind.
 * @description Vergleicht ID, Status und Name — die einzigen Felder die sich
 *   zwischen Polls ändern können. Reihenfolge muss identisch sein.
 * @param {DockerService[]} a - Bestehende Liste.
 * @param {DockerService[]} b - Neue Liste vom Server.
 * @returns {boolean} true wenn kein Update nötig.
 * @private
 */
function containersEqual(a: DockerService[], b: DockerService[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (c, i) => c.id === b[i].id && c.status === b[i].status && c.name === b[i].name,
  );
}

/**
 * Prüft ob zwei Stack-Listen inhaltlich gleich sind.
 * @description Vergleicht Name, Status und Container-Anzahl pro Stack.
 * @param {DockerStack[]} a - Bestehende Liste.
 * @param {DockerStack[]} b - Neue Liste vom Server.
 * @returns {boolean} true wenn kein Update nötig.
 * @private
 */
function stacksEqual(a: DockerStack[], b: DockerStack[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (s, i) =>
      s.name === b[i].name &&
      s.status === b[i].status &&
      s.containers.length === b[i].containers.length,
  );
}

/**
 * Prüft ob zwei ComposeStack-Listen inhaltlich gleich sind.
 * @description Vergleicht Name und Status — reicht für Filesystem-Scan-Ergebnis.
 * @param {ComposeStack[]} a - Bestehende Liste.
 * @param {ComposeStack[]} b - Neue Liste vom Scan.
 * @returns {boolean} true wenn kein Update nötig.
 * @private
 */
function composeStacksEqual(a: ComposeStack[], b: ComposeStack[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.name === b[i].name && s.status === b[i].status);
}

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

  on(DockerActions.loadContainersSuccess, (state, { containers }) => {
    if (containersEqual(state.containers, containers)) {
      return { ...state, isLoading: false };
    }
    return { ...state, containers, isLoading: false };
  }),

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

  // ── Container löschen ─────────────────────────────────────────────────
  on(DockerActions.removeContainer, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
    error: null,
  })),

  on(DockerActions.removeContainerSuccess, (state, { id }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    containers: state.containers.filter((c) => c.id !== id),
  })),

  on(DockerActions.removeContainerFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),

  // ── Container-Logs ────────────────────────────────────────────────────
  on(DockerActions.loadContainerLogs, (state, { id }) => ({
    ...state,
    logsPendingIds: [...state.logsPendingIds, id],
  })),

  on(DockerActions.loadContainerLogsSuccess, (state, { id, lines }) => ({
    ...state,
    logsPendingIds: state.logsPendingIds.filter((pid) => pid !== id),
    logs: { ...state.logs, [id]: lines },
  })),

  on(DockerActions.loadContainerLogsFailure, (state, { id, error }) => ({
    ...state,
    logsPendingIds: state.logsPendingIds.filter((pid) => pid !== id),
    error,
  })),

  // ── Stacks laden ──────────────────────────────────────────────────────
  on(DockerActions.loadStacks, (state) => ({
    ...state,
    stacksLoading: true,
  })),

  on(DockerActions.loadStacksSuccess, (state, { stacks }) => {
    if (stacksEqual(state.stacks, stacks)) {
      return { ...state, stacksLoading: false };
    }
    return { ...state, stacks, stacksLoading: false };
  }),

  on(DockerActions.loadStacksFailure, (state, { error }) => ({
    ...state,
    stacksLoading: false,
    error,
  })),

  // ── Stack starten ─────────────────────────────────────────────────────
  on(DockerActions.startStack, (state, { name }) => ({
    ...state,
    stackPendingNames: [...state.stackPendingNames, name],
  })),

  on(DockerActions.startStackSuccess, (state, { name }) => ({
    ...state,
    stackPendingNames: state.stackPendingNames.filter((n) => n !== name),
    stacks: state.stacks.map((s) =>
      s.name === name
        ? {
            ...s,
            status: 'running' as const,
            containers: s.containers.map((c) => ({ ...c, status: 'running' as const })),
          }
        : s,
    ),
  })),

  on(DockerActions.startStackFailure, (state, { name, error }) => ({
    ...state,
    stackPendingNames: state.stackPendingNames.filter((n) => n !== name),
    error,
  })),

  // ── Stack stoppen ─────────────────────────────────────────────────────
  on(DockerActions.stopStack, (state, { name }) => ({
    ...state,
    stackPendingNames: [...state.stackPendingNames, name],
  })),

  on(DockerActions.stopStackSuccess, (state, { name }) => ({
    ...state,
    stackPendingNames: state.stackPendingNames.filter((n) => n !== name),
    stacks: state.stacks.map((s) =>
      s.name === name
        ? {
            ...s,
            status: 'stopped' as const,
            containers: s.containers.map((c) => ({ ...c, status: 'stopped' as const })),
          }
        : s,
    ),
  })),

  on(DockerActions.stopStackFailure, (state, { name, error }) => ({
    ...state,
    stackPendingNames: state.stackPendingNames.filter((n) => n !== name),
    error,
  })),

  // ── Stack updaten (docker compose pull + up -d) ──────────────────────
  on(DockerActions.updateStack, (state, { name }) => ({
    ...state,
    stackUpdatingNames: [...state.stackUpdatingNames, name],
    error: null,
  })),

  on(DockerActions.updateStackSuccess, (state, { name }) => ({
    ...state,
    stackUpdatingNames: state.stackUpdatingNames.filter((n) => n !== name),
  })),

  on(DockerActions.updateStackFailure, (state, { name, error }) => ({
    ...state,
    stackUpdatingNames: state.stackUpdatingNames.filter((n) => n !== name),
    error,
  })),

  // ── Compose-Stacks scannen ────────────────────────────────────────────
  on(DockerActions.scanComposeStacks, (state) => ({
    ...state,
    composeStacksLoading: true,
  })),

  on(DockerActions.scanComposeStacksSuccess, (state, { composeStacks }) => {
    if (composeStacksEqual(state.composeStacks, composeStacks)) {
      return { ...state, composeStacksLoading: false };
    }
    return { ...state, composeStacks, composeStacksLoading: false };
  }),

  on(DockerActions.scanComposeStacksFailure, (state) => ({
    ...state,
    composeStacksLoading: false,
  })),
);

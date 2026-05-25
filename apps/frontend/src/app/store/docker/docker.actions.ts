/**
 * @fileoverview Docker Actions — NgRx Action-Definitionen für Container-Management
 * @description Alle Actions des Docker-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via DockerActions.loadContainers etc.
 *   Deckt: Container-Liste laden, Stats laden, Container starten/stoppen.
 * @module DockerActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ContainerStats, DockerService } from '@workspace2k/shared';

/**
 * Docker Action Group — alle Container-Management-Actions.
 * @description
 *   loadContainers → GET /api/docker/containers
 *   loadContainerStats → GET /api/docker/containers/:id/stats (nach loadContainersSuccess)
 *   startContainer / stopContainer → POST /api/docker/containers/:id/start|stop
 */
export const DockerActions = createActionGroup({
  source: 'Docker',
  events: {
    // ── Container-Liste ──────────────────────────────────────────────────
    'Load Containers': emptyProps(),
    'Load Containers Success': props<{ containers: DockerService[] }>(),
    'Load Containers Failure': props<{ error: string }>(),

    // ── Container-Stats ──────────────────────────────────────────────────
    'Load Container Stats': props<{ id: string }>(),
    'Load Container Stats Success': props<{ id: string; stats: ContainerStats }>(),
    'Load Container Stats Failure': props<{ id: string }>(),

    // ── Container starten ────────────────────────────────────────────────
    'Start Container': props<{ id: string }>(),
    'Start Container Success': props<{ id: string }>(),
    'Start Container Failure': props<{ id: string; error: string }>(),

    // ── Container stoppen ────────────────────────────────────────────────
    'Stop Container': props<{ id: string }>(),
    'Stop Container Success': props<{ id: string }>(),
    'Stop Container Failure': props<{ id: string; error: string }>(),

    // ── Container löschen ────────────────────────────────────────────────
    'Remove Container': props<{ id: string }>(),
    'Remove Container Success': props<{ id: string }>(),
    'Remove Container Failure': props<{ id: string; error: string }>(),

    // ── Container-Logs ───────────────────────────────────────────────────
    'Load Container Logs': props<{ id: string; tail?: number }>(),
    'Load Container Logs Success': props<{ id: string; lines: string[] }>(),
    'Load Container Logs Failure': props<{ id: string; error: string }>(),
  },
});

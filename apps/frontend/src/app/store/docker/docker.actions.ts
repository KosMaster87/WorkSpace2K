/**
 * @fileoverview Docker Actions — NgRx Action-Definitionen für Container-Management
 * @description Alle Actions des Docker-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via DockerActions.loadContainers etc.
 *   Deckt: Container-Liste laden, Stats laden, Container starten/stoppen.
 * @module DockerActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ComposeStack,
  ContainerStats,
  DockerService,
  DockerStack,
  StackUpdateResult,
} from '@workspace2k/shared';

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

    // ── Stacks ───────────────────────────────────────────────────────────
    'Load Stacks': emptyProps(),
    'Load Stacks Success': props<{ stacks: DockerStack[] }>(),
    'Load Stacks Failure': props<{ error: string }>(),

    // ── Stack starten ─────────────────────────────────────────────────────
    'Start Stack': props<{ name: string }>(),
    'Start Stack Success': props<{ name: string }>(),
    'Start Stack Failure': props<{ name: string; error: string }>(),

    // ── Stack stoppen ─────────────────────────────────────────────────────
    'Stop Stack': props<{ name: string }>(),
    'Stop Stack Success': props<{ name: string }>(),
    'Stop Stack Failure': props<{ name: string; error: string }>(),

    // ── Stack updaten (docker compose pull + up -d) ────────────────────────
    'Update Stack': props<{ name: string }>(),
    'Update Stack Success': props<{ name: string; result: StackUpdateResult }>(),
    'Update Stack Failure': props<{ name: string; error: string }>(),

    // ── Compose-Stacks scannen (Filesystem-Scan) ──────────────────────────
    'Scan Compose Stacks': emptyProps(),
    'Scan Compose Stacks Success': props<{ composeStacks: ComposeStack[] }>(),
    'Scan Compose Stacks Failure': props<{ error: string }>(),
  },
});

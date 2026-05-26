/**
 * @fileoverview Docker Effects — Asynchrone Side Effects für Container- und Stack-Management
 * @description Alle NgRx Effects für Docker-Actions. Funktional (kein Klassen-Decorator).
 *   Effects übernehmen: API-Kommunikation via ContainerService.
 *   Komponenten und Reducer bleiben rein — keine Side Effects dort.
 * @module DockerEffects
 */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  ComposeStack,
  ContainerStats,
  DockerService,
  DockerStack,
  StackUpdateResult,
} from '@workspace2k/shared';
import { EMPTY, catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { ContainerService } from '../../core/services/container.service';
import { DockerActions } from './docker.actions';

/**
 * Lädt alle Container und dispatcht Erfolg oder Fehler.
 * @description switchMap bricht vorherige Requests ab (verhindert Race Conditions
 *   wenn loadContainers mehrfach schnell hintereinander dispatcht wird).
 * @returns {Observable<Action>} loadContainersSuccess oder loadContainersFailure.
 */
export const loadContainersEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.loadContainers),
      switchMap(() =>
        containerService.getContainers().pipe(
          map((containers: DockerService[]) => DockerActions.loadContainersSuccess({ containers })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Container konnten nicht geladen werden';
            return of(DockerActions.loadContainersFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Lädt Stats für alle laufenden Container nach loadContainersSuccess.
 * @description mergeMap — alle Requests laufen parallel, keiner bricht den anderen ab.
 *   Fehler einzelner Stat-Requests werden still ignoriert (EMPTY) —
 *   kein Error-Banner, da Stats optional sind.
 * @returns {Observable<Action>} loadContainerStatsSuccess pro Container (oder nichts).
 */
export const loadStatsAfterContainersEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.loadContainersSuccess),
      switchMap(({ containers }) => {
        const running = containers.filter((c: DockerService) => c.status === 'running');
        return running.length === 0
          ? EMPTY
          : of(...running).pipe(
              mergeMap((container: DockerService) =>
                containerService.getContainerStats(container.id).pipe(
                  map((stats: ContainerStats) =>
                    DockerActions.loadContainerStatsSuccess({ id: container.id, stats }),
                  ),
                  catchError(() =>
                    of(DockerActions.loadContainerStatsFailure({ id: container.id })),
                  ),
                ),
              ),
            );
      }),
    ),
  { functional: true },
);

/**
 * Lädt Stacks automatisch nach loadContainersSuccess.
 * @description Stacks werden parallel zu den Containern geladen, damit beide Ansichten
 *   (flat + stacks) nach dem initialen Laden aktuell sind.
 * @returns {Observable<Action>} loadStacks.
 */
export const loadStacksAfterContainersEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(DockerActions.loadContainersSuccess),
      map(() => DockerActions.loadStacks()),
    ),
  { functional: true },
);

/**
 * Lädt alle Stacks und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} loadStacksSuccess oder loadStacksFailure.
 */
export const loadStacksEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.loadStacks),
      switchMap(() =>
        containerService.getStacks().pipe(
          map((stacks: DockerStack[]) => DockerActions.loadStacksSuccess({ stacks })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Stacks konnten nicht geladen werden';
            return of(DockerActions.loadStacksFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Startet einen Container und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} startContainerSuccess oder startContainerFailure.
 */
export const startContainerEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.startContainer),
      switchMap(({ id }: { id: string }) =>
        containerService.startContainer(id).pipe(
          map(() => DockerActions.startContainerSuccess({ id })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Container konnte nicht gestartet werden';
            return of(DockerActions.startContainerFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Stoppt einen Container und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} stopContainerSuccess oder stopContainerFailure.
 */
export const stopContainerEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.stopContainer),
      switchMap(({ id }: { id: string }) =>
        containerService.stopContainer(id).pipe(
          map(() => DockerActions.stopContainerSuccess({ id })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Container konnte nicht gestoppt werden';
            return of(DockerActions.stopContainerFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Löscht einen Container und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} removeContainerSuccess oder removeContainerFailure.
 */
export const removeContainerEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.removeContainer),
      switchMap(({ id }: { id: string }) =>
        containerService.removeContainer(id).pipe(
          map(() => DockerActions.removeContainerSuccess({ id })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Container konnte nicht gelöscht werden';
            return of(DockerActions.removeContainerFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Lädt die Log-Zeilen eines Containers und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} loadContainerLogsSuccess oder loadContainerLogsFailure.
 */
export const loadContainerLogsEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.loadContainerLogs),
      switchMap(({ id, tail }: { id: string; tail?: number }) =>
        containerService.getContainerLogs(id, tail).pipe(
          map((lines: string[]) => DockerActions.loadContainerLogsSuccess({ id, lines })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'Logs konnten nicht geladen werden';
            return of(DockerActions.loadContainerLogsFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Startet alle Container eines Stacks und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} startStackSuccess oder startStackFailure.
 */
export const startStackEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.startStack),
      switchMap(({ name }: { name: string }) =>
        containerService.startStack(name).pipe(
          map(() => DockerActions.startStackSuccess({ name })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Stack konnte nicht gestartet werden';
            return of(DockerActions.startStackFailure({ name, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Stoppt alle Container eines Stacks und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} stopStackSuccess oder stopStackFailure.
 */
export const stopStackEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.stopStack),
      switchMap(({ name }: { name: string }) =>
        containerService.stopStack(name).pipe(
          map(() => DockerActions.stopStackSuccess({ name })),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'Stack konnte nicht gestoppt werden';
            return of(DockerActions.stopStackFailure({ name, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Aktualisiert einen Stack via docker compose pull + up -d.
 * @description Dauert bis zu mehreren Minuten (Image-Download). Nach Success:
 *   Container und Stacks werden neu geladen damit der UI-Stand aktuell ist.
 * @returns {Observable<Action>} updateStackSuccess + loadContainers, oder updateStackFailure.
 */
export const updateStackEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.updateStack),
      switchMap(({ name }: { name: string }) =>
        containerService.updateStack(name).pipe(
          mergeMap((result: StackUpdateResult) => [
            DockerActions.updateStackSuccess({ name, result }),
            DockerActions.loadContainers(), // Neu laden damit aktueller Stand sichtbar ist
          ]),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'Stack-Update fehlgeschlagen';
            return of(DockerActions.updateStackFailure({ name, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Scannt das Stacks-Verzeichnis nach Compose-Files.
 * @returns {Observable<Action>} scanComposeStacksSuccess oder scanComposeStacksFailure.
 */
export const scanComposeStacksEffect = createEffect(
  (actions$ = inject(Actions), containerService = inject(ContainerService)) =>
    actions$.pipe(
      ofType(DockerActions.scanComposeStacks),
      switchMap(() =>
        containerService.scanComposeStacks().pipe(
          map((composeStacks: ComposeStack[]) =>
            DockerActions.scanComposeStacksSuccess({ composeStacks }),
          ),
          catchError((err: unknown) => {
            const error = err instanceof Error ? err.message : 'Filesystem-Scan fehlgeschlagen';
            return of(DockerActions.scanComposeStacksFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

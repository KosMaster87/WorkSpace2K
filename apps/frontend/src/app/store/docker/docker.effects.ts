/**
 * @fileoverview Docker Effects — Asynchrone Side Effects für Container-Management
 * @description Alle NgRx Effects für Docker-Actions. Funktional (kein Klassen-Decorator).
 *   Effects übernehmen: API-Kommunikation via ContainerService.
 *   Komponenten und Reducer bleiben rein — keine Side Effects dort.
 * @module DockerEffects
 */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ContainerService } from '../../core/services/container.service';
import { Container } from './docker.state';
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
          map((containers: Container[]) => DockerActions.loadContainersSuccess({ containers })),
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
 * Startet einen Container und dispatcht Erfolg oder Fehler.
 * @description mergeMap statt switchMap — mehrere Container können gleichzeitig gestartet werden.
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

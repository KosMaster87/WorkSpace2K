/**
 * @fileoverview Destinations Effects — Asynchrone Side Effects für Destinations
 * @description Alle NgRx Effects für Destinations-Actions. Funktional (kein Klassen-Decorator).
 * @module DestinationsEffects
 */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Destination } from '@workspace2k/shared';
import { catchError, map, of, switchMap } from 'rxjs';
import { DestinationService } from '../../core/services/destination.service';
import { DestinationsActions } from './destinations.actions';

/**
 * Lädt alle Destinations und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} loadDestinationsSuccess oder loadDestinationsFailure.
 */
export const loadDestinationsEffect = createEffect(
  (actions$ = inject(Actions), destinationService = inject(DestinationService)) =>
    actions$.pipe(
      ofType(DestinationsActions.loadDestinations),
      switchMap(() =>
        destinationService.getDestinations().pipe(
          map((destinations: Destination[]) =>
            DestinationsActions.loadDestinationsSuccess({ destinations }),
          ),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Destinations konnten nicht geladen werden';
            return of(DestinationsActions.loadDestinationsFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Legt eine neue Destination an und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} createDestinationSuccess oder createDestinationFailure.
 */
export const createDestinationEffect = createEffect(
  (actions$ = inject(Actions), destinationService = inject(DestinationService)) =>
    actions$.pipe(
      ofType(DestinationsActions.createDestination),
      switchMap(({ payload }) =>
        destinationService.createDestination(payload).pipe(
          map((destination: Destination) =>
            DestinationsActions.createDestinationSuccess({ destination }),
          ),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Destination konnte nicht angelegt werden';
            return of(DestinationsActions.createDestinationFailure({ error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Aktualisiert eine Destination und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} updateDestinationSuccess oder updateDestinationFailure.
 */
export const updateDestinationEffect = createEffect(
  (actions$ = inject(Actions), destinationService = inject(DestinationService)) =>
    actions$.pipe(
      ofType(DestinationsActions.updateDestination),
      switchMap(({ id, payload }) =>
        destinationService.updateDestination(id, payload).pipe(
          map((destination: Destination) =>
            DestinationsActions.updateDestinationSuccess({ destination }),
          ),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Destination konnte nicht aktualisiert werden';
            return of(DestinationsActions.updateDestinationFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Löscht eine Destination und dispatcht Erfolg oder Fehler.
 * @returns {Observable<Action>} deleteDestinationSuccess oder deleteDestinationFailure.
 */
export const deleteDestinationEffect = createEffect(
  (actions$ = inject(Actions), destinationService = inject(DestinationService)) =>
    actions$.pipe(
      ofType(DestinationsActions.deleteDestination),
      switchMap(({ id }) =>
        destinationService.deleteDestination(id).pipe(
          map(() => DestinationsActions.deleteDestinationSuccess({ id })),
          catchError((err: unknown) => {
            const error =
              err instanceof Error ? err.message : 'Destination konnte nicht gelöscht werden';
            return of(DestinationsActions.deleteDestinationFailure({ id, error }));
          }),
        ),
      ),
    ),
  { functional: true },
);

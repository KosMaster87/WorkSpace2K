/**
 * @fileoverview Destinations Actions — NgRx Action-Definitionen für Destinations
 * @description Alle Actions des Destinations-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via DestinationsActions.loadDestinations etc.
 * @module DestinationsActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Destination } from '@workspace2k/shared';
import {
  CreateDestinationPayload,
  UpdateDestinationPayload,
} from '../../core/services/destination.service';

/**
 * Destinations Action Group — alle Destinations-Actions.
 */
export const DestinationsActions = createActionGroup({
  source: 'Destinations',
  events: {
    // ── Liste laden ──────────────────────────────────────────────────────
    'Load Destinations': emptyProps(),
    'Load Destinations Success': props<{ destinations: Destination[] }>(),
    'Load Destinations Failure': props<{ error: string }>(),

    // ── Destination anlegen ─────────────────────────────────────────────
    'Create Destination': props<{ payload: CreateDestinationPayload }>(),
    'Create Destination Success': props<{ destination: Destination }>(),
    'Create Destination Failure': props<{ error: string }>(),

    // ── Destination bearbeiten ──────────────────────────────────────────
    'Update Destination': props<{ id: string; payload: UpdateDestinationPayload }>(),
    'Update Destination Success': props<{ destination: Destination }>(),
    'Update Destination Failure': props<{ id: string; error: string }>(),

    // ── Destination löschen ─────────────────────────────────────────────
    'Delete Destination': props<{ id: string }>(),
    'Delete Destination Success': props<{ id: string }>(),
    'Delete Destination Failure': props<{ id: string; error: string }>(),
  },
});

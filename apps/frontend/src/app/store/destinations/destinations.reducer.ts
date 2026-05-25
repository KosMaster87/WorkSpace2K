/**
 * @fileoverview Destinations Reducer — State-Übergänge für Destinations-Actions
 * @description Pure Funktion: alter State + Action → neuer State.
 *   pendingIds: bei Update und Delete hinzugefügt, bei Success/Failure entfernt.
 *   isCreating-Flag steuert den Submit-Button-Zustand.
 * @module DestinationsReducer
 */

import { createReducer, on } from '@ngrx/store';
import { DestinationsActions } from './destinations.actions';
import { initialDestinationsState, DestinationsState } from './destinations.state';

/**
 * Destinations Feature Reducer.
 */
export const destinationsReducer = createReducer<DestinationsState>(
  initialDestinationsState,

  // ── Liste laden ────────────────────────────────────────────────────────
  on(DestinationsActions.loadDestinations, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(DestinationsActions.loadDestinationsSuccess, (state, { destinations }) => ({
    ...state,
    destinations,
    isLoading: false,
  })),

  on(DestinationsActions.loadDestinationsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // ── Destination anlegen ────────────────────────────────────────────────
  on(DestinationsActions.createDestination, (state) => ({
    ...state,
    isCreating: true,
    error: null,
  })),

  on(DestinationsActions.createDestinationSuccess, (state, { destination }) => ({
    ...state,
    destinations: [...state.destinations, destination],
    isCreating: false,
  })),

  on(DestinationsActions.createDestinationFailure, (state, { error }) => ({
    ...state,
    isCreating: false,
    error,
  })),

  // ── Destination bearbeiten ─────────────────────────────────────────────
  on(DestinationsActions.updateDestination, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
    error: null,
  })),

  on(DestinationsActions.updateDestinationSuccess, (state, { destination }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== destination.id),
    destinations: state.destinations.map((d) => (d.id === destination.id ? destination : d)),
  })),

  on(DestinationsActions.updateDestinationFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),

  // ── Destination löschen ────────────────────────────────────────────────
  on(DestinationsActions.deleteDestination, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
    error: null,
  })),

  on(DestinationsActions.deleteDestinationSuccess, (state, { id }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    destinations: state.destinations.filter((d) => d.id !== id),
  })),

  on(DestinationsActions.deleteDestinationFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),
);

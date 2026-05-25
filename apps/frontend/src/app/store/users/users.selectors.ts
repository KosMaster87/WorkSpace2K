/**
 * @fileoverview Users Selectors — Memoized Selektoren für den Users-Store
 * @description Alle Selektoren für den users-Feature-State.
 * @module UsersSelectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from './users.state';

const selectUsersState = createFeatureSelector<UsersState>('users');

/**
 * Gibt die vollständige User-Liste zurück.
 * @returns {User[]}
 */
export const selectAllUsers = createSelector(selectUsersState, (s) => s.users);

/**
 * Gibt true zurück während die User-Liste geladen wird.
 * @returns {boolean}
 */
export const selectUsersLoading = createSelector(selectUsersState, (s) => s.isLoading);

/**
 * Gibt true zurück während ein neuer User angelegt wird.
 * @returns {boolean}
 */
export const selectUsersCreating = createSelector(selectUsersState, (s) => s.isCreating);

/**
 * Gibt die IDs der User zurück bei denen gerade Role-Change oder Delete läuft.
 * @returns {string[]}
 */
export const selectUsersPendingIds = createSelector(selectUsersState, (s) => s.pendingIds);

/**
 * Gibt die aktuelle Fehlermeldung zurück oder null.
 * @returns {string | null}
 */
export const selectUsersError = createSelector(selectUsersState, (s) => s.error);

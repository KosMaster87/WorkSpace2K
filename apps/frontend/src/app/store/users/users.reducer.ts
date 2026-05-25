/**
 * @fileoverview Users Reducer — State-Übergänge für Users-Actions
 * @description Pure Funktion: alter State + Action → neuer State.
 *   pendingIds: bei Role-Change und Delete hinzugefügt, bei Success/Failure entfernt.
 *   createUser: isCreating-Flag steuert den Submit-Button-Zustand.
 * @module UsersReducer
 */

import { createReducer, on } from '@ngrx/store';
import { UsersActions } from './users.actions';
import { initialUsersState, UsersState } from './users.state';

/**
 * Users Feature Reducer.
 */
export const usersReducer = createReducer<UsersState>(
  initialUsersState,

  // ── Liste laden ────────────────────────────────────────────────────────
  on(UsersActions.loadUsers, (state) => ({ ...state, isLoading: true, error: null })),

  on(UsersActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    isLoading: false,
  })),

  on(UsersActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // ── User anlegen ──────────────────────────────────────────────────────
  on(UsersActions.createUser, (state) => ({ ...state, isCreating: true, error: null })),

  on(UsersActions.createUserSuccess, (state, { user }) => ({
    ...state,
    users: [...state.users, user],
    isCreating: false,
  })),

  on(UsersActions.createUserFailure, (state, { error }) => ({
    ...state,
    isCreating: false,
    error,
  })),

  // ── Rolle ändern ──────────────────────────────────────────────────────
  on(UsersActions.updateUserRole, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
    error: null,
  })),

  on(UsersActions.updateUserRoleSuccess, (state, { user }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== user.id),
    users: state.users.map((u) => (u.id === user.id ? user : u)),
  })),

  on(UsersActions.updateUserRoleFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),

  // ── User löschen ──────────────────────────────────────────────────────
  on(UsersActions.deleteUser, (state, { id }) => ({
    ...state,
    pendingIds: [...state.pendingIds, id],
    error: null,
  })),

  on(UsersActions.deleteUserSuccess, (state, { id }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    users: state.users.filter((u) => u.id !== id),
  })),

  on(UsersActions.deleteUserFailure, (state, { id, error }) => ({
    ...state,
    pendingIds: state.pendingIds.filter((pid) => pid !== id),
    error,
  })),
);

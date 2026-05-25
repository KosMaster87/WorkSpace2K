/**
 * @fileoverview Users Actions — NgRx Action-Definitionen für User-Management
 * @description Alle Actions des Users-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via UsersActions.loadUsers etc.
 * @module UsersActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '@workspace2k/shared';
import { CreateUserPayload } from '../../core/services/user.service';

/**
 * Users Action Group — alle User-Management-Actions.
 */
export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    // ── Liste laden ──────────────────────────────────────────────────────
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),

    // ── User anlegen ────────────────────────────────────────────────────
    'Create User': props<{ payload: CreateUserPayload }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: string }>(),

    // ── Rolle ändern ────────────────────────────────────────────────────
    'Update User Role': props<{ id: string; role: 'ADMIN' | 'USER' }>(),
    'Update User Role Success': props<{ user: User }>(),
    'Update User Role Failure': props<{ id: string; error: string }>(),

    // ── User löschen ────────────────────────────────────────────────────
    'Delete User': props<{ id: string }>(),
    'Delete User Success': props<{ id: string }>(),
    'Delete User Failure': props<{ id: string; error: string }>(),
  },
});

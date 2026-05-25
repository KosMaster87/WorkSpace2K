/**
 * @fileoverview Users Reducer Tests
 * @description Prüft alle State-Übergänge: loadUsers, createUser,
 *   updateUserRole, deleteUser — jeweils Request/Success/Failure.
 */

import { UsersActions } from './users.actions';
import { usersReducer } from './users.reducer';
import { initialUsersState, User, UsersState } from './users.state';

const mockUser: User = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'user',
};

const mockAdmin: User = {
  id: 'u2',
  email: 'bob@example.com',
  name: 'Bob',
  role: 'admin',
};

const withUsers: UsersState = {
  ...initialUsersState,
  users: [mockUser, mockAdmin],
};

describe('usersReducer', () => {
  it('should return initial state for unknown action', () => {
    const state = usersReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialUsersState);
  });

  // ── loadUsers ──────────────────────────────────────────────────────────────

  describe('loadUsers', () => {
    it('should set isLoading to true', () => {
      const state = usersReducer(initialUsersState, UsersActions.loadUsers());
      expect(state.isLoading).toBe(true);
    });

    it('should clear error', () => {
      const withError = { ...initialUsersState, error: 'old error' };
      const state = usersReducer(withError, UsersActions.loadUsers());
      expect(state.error).toBeNull();
    });
  });

  describe('loadUsersSuccess', () => {
    it('should set users list', () => {
      const state = usersReducer(
        { ...initialUsersState, isLoading: true },
        UsersActions.loadUsersSuccess({ users: [mockUser, mockAdmin] }),
      );
      expect(state.users).toEqual([mockUser, mockAdmin]);
    });

    it('should set isLoading to false', () => {
      const state = usersReducer(
        { ...initialUsersState, isLoading: true },
        UsersActions.loadUsersSuccess({ users: [] }),
      );
      expect(state.isLoading).toBe(false);
    });
  });

  describe('loadUsersFailure', () => {
    it('should set error message', () => {
      const state = usersReducer(
        { ...initialUsersState, isLoading: true },
        UsersActions.loadUsersFailure({ error: 'Netzwerkfehler' }),
      );
      expect(state.error).toBe('Netzwerkfehler');
    });

    it('should set isLoading to false', () => {
      const state = usersReducer(
        { ...initialUsersState, isLoading: true },
        UsersActions.loadUsersFailure({ error: 'error' }),
      );
      expect(state.isLoading).toBe(false);
    });
  });

  // ── createUser ─────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should set isCreating to true', () => {
      const state = usersReducer(
        initialUsersState,
        UsersActions.createUser({
          payload: { name: 'Eve', email: 'eve@x.de', password: 'pw', role: 'USER' },
        }),
      );
      expect(state.isCreating).toBe(true);
    });

    it('should clear error', () => {
      const withError = { ...initialUsersState, error: 'old error' };
      const state = usersReducer(
        withError,
        UsersActions.createUser({
          payload: { name: 'Eve', email: 'eve@x.de', password: 'pw', role: 'USER' },
        }),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('createUserSuccess', () => {
    it('should append new user to list', () => {
      const newUser: User = { id: 'u3', email: 'eve@x.de', name: 'Eve', role: 'user' };
      const state = usersReducer(withUsers, UsersActions.createUserSuccess({ user: newUser }));
      expect(state.users).toHaveLength(3);
      expect(state.users[2]).toEqual(newUser);
    });

    it('should set isCreating to false', () => {
      const newUser: User = { id: 'u3', email: 'eve@x.de', name: 'Eve', role: 'user' };
      const state = usersReducer(
        { ...initialUsersState, isCreating: true },
        UsersActions.createUserSuccess({ user: newUser }),
      );
      expect(state.isCreating).toBe(false);
    });
  });

  describe('createUserFailure', () => {
    it('should set error and clear isCreating', () => {
      const state = usersReducer(
        { ...initialUsersState, isCreating: true },
        UsersActions.createUserFailure({ error: 'E-Mail bereits vergeben' }),
      );
      expect(state.error).toBe('E-Mail bereits vergeben');
      expect(state.isCreating).toBe(false);
    });
  });

  // ── updateUserRole ─────────────────────────────────────────────────────────

  describe('updateUserRole', () => {
    it('should add id to pendingIds', () => {
      const state = usersReducer(
        withUsers,
        UsersActions.updateUserRole({ id: 'u1', role: 'ADMIN' }),
      );
      expect(state.pendingIds).toContain('u1');
    });
  });

  describe('updateUserRoleSuccess', () => {
    const updatedUser: User = { ...mockUser, role: 'admin' };

    it('should remove id from pendingIds', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(
        pending,
        UsersActions.updateUserRoleSuccess({ user: updatedUser }),
      );
      expect(state.pendingIds).not.toContain('u1');
    });

    it('should update the user in the list', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(
        pending,
        UsersActions.updateUserRoleSuccess({ user: updatedUser }),
      );
      const found = state.users.find((u) => u.id === 'u1');
      expect(found?.role).toBe('admin');
    });
  });

  describe('updateUserRoleFailure', () => {
    it('should remove id from pendingIds and set error', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(
        pending,
        UsersActions.updateUserRoleFailure({ id: 'u1', error: 'Forbidden' }),
      );
      expect(state.pendingIds).not.toContain('u1');
      expect(state.error).toBe('Forbidden');
    });
  });

  // ── deleteUser ─────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('should add id to pendingIds', () => {
      const state = usersReducer(withUsers, UsersActions.deleteUser({ id: 'u1' }));
      expect(state.pendingIds).toContain('u1');
    });
  });

  describe('deleteUserSuccess', () => {
    it('should remove user from list', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(pending, UsersActions.deleteUserSuccess({ id: 'u1' }));
      expect(state.users.find((u) => u.id === 'u1')).toBeUndefined();
      expect(state.users).toHaveLength(1);
    });

    it('should remove id from pendingIds', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(pending, UsersActions.deleteUserSuccess({ id: 'u1' }));
      expect(state.pendingIds).not.toContain('u1');
    });
  });

  describe('deleteUserFailure', () => {
    it('should remove id from pendingIds and set error', () => {
      const pending = { ...withUsers, pendingIds: ['u1'] };
      const state = usersReducer(
        pending,
        UsersActions.deleteUserFailure({ id: 'u1', error: 'Nicht gefunden' }),
      );
      expect(state.pendingIds).not.toContain('u1');
      expect(state.error).toBe('Nicht gefunden');
    });
  });
});

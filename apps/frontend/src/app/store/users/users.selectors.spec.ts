/**
 * @fileoverview Users Selectors Tests
 * @description Prüft alle Selektoren: selectAllUsers, selectUsersLoading,
 *   selectUsersCreating, selectUsersPendingIds, selectUsersError.
 */

import {
  selectAllUsers,
  selectUsersCreating,
  selectUsersError,
  selectUsersLoading,
  selectUsersPendingIds,
} from './users.selectors';
import { UsersState, User } from './users.state';

const mockUser: User = { id: 'u1', email: 'alice@x.de', name: 'Alice', role: 'user' };
const mockAdmin: User = { id: 'u2', email: 'bob@x.de', name: 'Bob', role: 'admin' };

const buildState = (partial: Partial<UsersState>): { users: UsersState } => ({
  users: {
    users: [],
    isLoading: false,
    isCreating: false,
    pendingIds: [],
    error: null,
    ...partial,
  },
});

describe('Users Selectors', () => {
  describe('selectAllUsers', () => {
    it('should return empty array on initial state', () => {
      expect(selectAllUsers(buildState({}))).toEqual([]);
    });

    it('should return all users', () => {
      expect(selectAllUsers(buildState({ users: [mockUser, mockAdmin] }))).toEqual([
        mockUser,
        mockAdmin,
      ]);
    });
  });

  describe('selectUsersLoading', () => {
    it('should return false on initial state', () => {
      expect(selectUsersLoading(buildState({}))).toBe(false);
    });

    it('should return true when loading', () => {
      expect(selectUsersLoading(buildState({ isLoading: true }))).toBe(true);
    });
  });

  describe('selectUsersCreating', () => {
    it('should return false on initial state', () => {
      expect(selectUsersCreating(buildState({}))).toBe(false);
    });

    it('should return true when creating', () => {
      expect(selectUsersCreating(buildState({ isCreating: true }))).toBe(true);
    });
  });

  describe('selectUsersPendingIds', () => {
    it('should return empty array on initial state', () => {
      expect(selectUsersPendingIds(buildState({}))).toEqual([]);
    });

    it('should return pending ids', () => {
      expect(selectUsersPendingIds(buildState({ pendingIds: ['u1', 'u2'] }))).toEqual(['u1', 'u2']);
    });
  });

  describe('selectUsersError', () => {
    it('should return null on initial state', () => {
      expect(selectUsersError(buildState({}))).toBeNull();
    });

    it('should return error message', () => {
      expect(selectUsersError(buildState({ error: 'Server Error' }))).toBe('Server Error');
    });
  });
});

/**
 * @fileoverview Auth Selectors Tests
 * @description Prüft alle Selektoren: selectUser, selectToken,
 *   selectIsAuthenticated, selectIsAdmin, selectAuthLoading, selectAuthError.
 */

import {
  selectAuthError,
  selectAuthLoading,
  selectIsAdmin,
  selectIsAuthenticated,
  selectToken,
  selectUser,
} from './auth.selectors';
import { User } from './auth.state';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
};

const mockState = {
  auth: {
    user: mockUser,
    token: 'test-token',
    isLoading: false,
    error: null,
  },
};

describe('Auth Selectors', () => {
  describe('selectUser', () => {
    it('should return the user', () => {
      expect(selectUser(mockState)).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      expect(selectUser({ auth: { ...mockState.auth, user: null } })).toBeNull();
    });
  });

  describe('selectToken', () => {
    it('should return the token', () => {
      expect(selectToken(mockState)).toBe('test-token');
    });

    it('should return null when no token', () => {
      expect(selectToken({ auth: { ...mockState.auth, token: null } })).toBeNull();
    });
  });

  describe('selectIsAuthenticated', () => {
    it('should return true when token exists', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('should return false when token is null', () => {
      expect(selectIsAuthenticated({ auth: { ...mockState.auth, token: null } })).toBe(false);
    });
  });

  describe('selectIsAdmin', () => {
    it('should return true when role is admin', () => {
      expect(selectIsAdmin(mockState)).toBe(true);
    });

    it('should return false when role is user', () => {
      const userState = {
        auth: { ...mockState.auth, user: { ...mockUser, role: 'user' as const } },
      };
      expect(selectIsAdmin(userState)).toBe(false);
    });

    it('should return false when no user', () => {
      expect(selectIsAdmin({ auth: { ...mockState.auth, user: null } })).toBe(false);
    });
  });

  describe('selectAuthLoading', () => {
    it('should return isLoading', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    it('should return true when loading', () => {
      expect(selectAuthLoading({ auth: { ...mockState.auth, isLoading: true } })).toBe(true);
    });
  });

  describe('selectAuthError', () => {
    it('should return null when no error', () => {
      expect(selectAuthError(mockState)).toBeNull();
    });

    it('should return error message', () => {
      const withError = { auth: { ...mockState.auth, error: 'Invalid credentials' } };
      expect(selectAuthError(withError)).toBe('Invalid credentials');
    });
  });
});

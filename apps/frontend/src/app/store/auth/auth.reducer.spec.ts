/**
 * @fileoverview Auth Reducer Tests
 * @description Prüft alle State-Übergänge: login, loginSuccess, loginFailure,
 *   logout, restoreSessionSuccess, restoreSessionFailure.
 */

import { AuthActions } from './auth.actions';
import { authReducer } from './auth.reducer';
import { AuthState, initialAuthState, User } from './auth.state';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
};

const loggedInState: AuthState = {
  user: mockUser,
  token: 'test-token',
  isLoading: false,
  error: null,
};

describe('authReducer', () => {
  it('should return initial state for unknown action', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialAuthState);
  });

  describe('login', () => {
    it('should set isLoading to true', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.login({ email: 'a@b.de', password: 'pw' }),
      );
      expect(state.isLoading).toBe(true);
    });

    it('should clear error', () => {
      const withError: AuthState = { ...initialAuthState, error: 'old error' };
      const state = authReducer(withError, AuthActions.login({ email: 'a@b.de', password: 'pw' }));
      expect(state.error).toBeNull();
    });

    it('should not change user or token', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.login({ email: 'a@b.de', password: 'pw' }),
      );
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set user and token', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginSuccess({ user: mockUser, token: 'jwt-abc' }),
      );
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-abc');
    });

    it('should set isLoading to false', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginSuccess({ user: mockUser, token: 'jwt-abc' }),
      );
      expect(state.isLoading).toBe(false);
    });

    it('should clear error', () => {
      const state = authReducer(
        { ...initialAuthState, error: 'old error' },
        AuthActions.loginSuccess({ user: mockUser, token: 'jwt-abc' }),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('loginFailure', () => {
    it('should set error message', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginFailure({ error: 'Invalid credentials' }),
      );
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set isLoading to false', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginFailure({ error: 'Invalid credentials' }),
      );
      expect(state.isLoading).toBe(false);
    });

    it('should not change user or token', () => {
      const state = authReducer(initialAuthState, AuthActions.loginFailure({ error: 'error' }));
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('logout', () => {
    it('should reset to initialAuthState', () => {
      const state = authReducer(loggedInState, AuthActions.logout());
      expect(state).toEqual(initialAuthState);
    });
  });

  describe('restoreSessionSuccess', () => {
    it('should set user and token', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.restoreSessionSuccess({ user: mockUser, token: 'new-token' }),
      );
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('new-token');
    });
  });

  describe('restoreSessionFailure', () => {
    it('should reset to initialAuthState', () => {
      const state = authReducer(loggedInState, AuthActions.restoreSessionFailure());
      expect(state).toEqual(initialAuthState);
    });
  });
});

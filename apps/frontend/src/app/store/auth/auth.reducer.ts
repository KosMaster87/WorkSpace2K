import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isLoading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(AuthActions.logout, () => initialAuthState),

  on(AuthActions.restoreSessionSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
  })),

  on(AuthActions.restoreSessionFailure, () => initialAuthState),
);

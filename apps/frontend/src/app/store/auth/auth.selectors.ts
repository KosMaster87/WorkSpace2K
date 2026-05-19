import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (s) => s.user);
export const selectToken = createSelector(selectAuthState, (s) => s.token);
export const selectIsAuthenticated = createSelector(selectAuthState, (s) => !!s.token);
export const selectIsAdmin = createSelector(selectUser, (user) => user?.role === 'admin');
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.isLoading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);

/**
 * @fileoverview Auth Selectors — Memoized State-Abfragen für den Auth-Store
 * @description Alle Selektoren für den Auth-Feature-State.
 *   Selektoren werden in Komponenten (selectSignal) und Guards (store.select) genutzt.
 *   selectIsAdmin prüft role === 'admin' — case-sensitive (Backend gibt lowercase zurück).
 * @module AuthSelectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

/**
 * Feature-Selektor für den gesamten Auth-State.
 * @description Basis-Selektor — alle anderen Auth-Selektoren bauen darauf auf.
 */
export const selectAuthState = createFeatureSelector<AuthState>('auth');

/**
 * Selektiert den eingeloggten User oder null.
 * @returns {User | null} Aktueller User-Objekt oder null.
 */
export const selectUser = createSelector(selectAuthState, (s) => s.user);

/**
 * Selektiert den JWT-Token oder null.
 * @description Wird vom authInterceptor genutzt um den Bearer-Header zu setzen.
 * @returns {string | null} JWT-Token oder null.
 */
export const selectToken = createSelector(selectAuthState, (s) => s.token);

/**
 * Selektiert ob der User authentifiziert ist (Token vorhanden).
 * @description Wird von authGuard und guestGuard genutzt.
 * @returns {boolean} true wenn Token vorhanden.
 */
export const selectIsAuthenticated = createSelector(selectAuthState, (s) => !!s.token);

/**
 * Selektiert ob der User die ADMIN-Rolle hat.
 * @description Wird vom adminGuard genutzt. Backend gibt role lowercase zurück ('admin').
 * @returns {boolean} true wenn user.role === 'admin'.
 */
export const selectIsAdmin = createSelector(selectUser, (user) => user?.role === 'admin');

/**
 * Selektiert den Loading-State (während Login oder Session Restore).
 * @returns {boolean} true während API-Request läuft.
 */
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.isLoading);

/**
 * Selektiert die letzte Fehlermeldung oder null.
 * @description Wird in der Login-Page angezeigt.
 * @returns {string | null} Fehlermeldung oder null.
 */
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);

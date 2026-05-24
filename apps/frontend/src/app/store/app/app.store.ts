/**
 * @fileoverview App Signal Store — Synchroner UI-State
 * @description NgRx Signal Store für den globalen UI-State.
 *   Verwaltet: Theme (light/dark), Sidebar-Zustand, aktueller Seitentitel.
 *   Synchron und reaktiv — kein Boilerplate wie beim klassischen NgRx Store.
 *   Persistenz von Theme in localStorage ('ws2k_theme').
 * @module AppStore
 */

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

/**
 * Mögliche App-Themes.
 */
export type Theme = 'light' | 'dark';

/**
 * Zustandsstruktur des App Signal Store.
 * @interface AppState
 */
interface AppState {
  /** Aktuelles Theme — wird auch als data-theme-Attribut auf <html> gesetzt. */
  theme: Theme;
  /** true wenn die Sidebar eingeklappt ist. */
  sidebarCollapsed: boolean;
  /** Aktuell angezeigter Seitentitel im Header. */
  pageTitle: string;
}

/** Initialzustand: Dark Mode, Sidebar ausgeklappt, Titel 'Dashboard'. */
const initialState: AppState = {
  theme: 'dark',
  sidebarCollapsed: false,
  pageTitle: 'Dashboard',
};

/**
 * Globaler UI-State Store (NgRx Signal Store).
 * @description providedIn: 'root' — singleton, überall injizierbar.
 *   Methoden ändern den State direkt via patchState (kein Action/Reducer nötig).
 */
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    /**
     * Wechselt zwischen dark und light Theme.
     * @description Aktualisiert State, setzt data-theme auf <html> und speichert in localStorage.
     * @returns {void}
     */
    toggleTheme(): void {
      const next: Theme = store.theme() === 'dark' ? 'light' : 'dark';
      patchState(store, { theme: next });
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ws2k_theme', next);
    },

    /**
     * Klappt die Sidebar ein oder aus.
     * @returns {void}
     */
    toggleSidebar(): void {
      patchState(store, { sidebarCollapsed: !store.sidebarCollapsed() });
    },

    /**
     * Setzt den Seitentitel im Header.
     * @description Wird in ngOnInit jeder Feature-Komponente aufgerufen.
     * @param {string} title - Neuer Seitentitel.
     * @returns {void}
     */
    setPageTitle(title: string): void {
      patchState(store, { pageTitle: title });
    },

    /**
     * Stellt das gespeicherte Theme aus localStorage wieder her.
     * @description Wird beim App-Start in app.ts ngOnInit aufgerufen.
     *   Fallback: 'dark' wenn kein Wert in localStorage gespeichert ist.
     * @returns {void}
     */
    restoreTheme(): void {
      const saved = (localStorage.getItem('ws2k_theme') as Theme) ?? 'dark';
      patchState(store, { theme: saved });
      document.documentElement.setAttribute('data-theme', saved);
    },
  })),
);

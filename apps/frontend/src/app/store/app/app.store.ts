/**
 * @fileoverview App Signal Store — Synchroner UI-State
 * @description NgRx Signal Store für den globalen UI-State.
 *   Verwaltet: Theme (light/dark), Sidebar-Zustand, aktueller Seitentitel,
 *   Docker-Ansicht (stacks/flat).
 *   Synchron und reaktiv — kein Boilerplate wie beim klassischen NgRx Store.
 *   Persistenz von Theme und dockerView in localStorage.
 * @module AppStore
 */

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

/**
 * Mögliche App-Themes.
 */
export type Theme = 'light' | 'dark';

/**
 * Mögliche Anzeigemodi der Docker-Seite.
 *   'stacks' — Container nach Compose-Projekt gruppiert als Karten.
 *   'flat'   — Flache Tabelle aller Container (klassische Ansicht).
 */
export type DockerView = 'stacks' | 'flat';

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
  /** Anzeigemodus der Docker-Seite — gespeichert in localStorage. */
  dockerView: DockerView;
}

/** Initialzustand: Dark Mode, Sidebar ausgeklappt, Titel 'Dashboard', Stacks-Ansicht. */
const initialState: AppState = {
  theme: 'dark',
  sidebarCollapsed: false,
  pageTitle: 'Dashboard',
  dockerView: 'stacks',
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

    /**
     * Setzt den Anzeigemodus der Docker-Seite und speichert ihn in localStorage.
     * @description Persistiert die Auswahl — bleibt nach Seiten-Refresh erhalten.
     * @param {DockerView} view - Neuer Anzeigemodus ('stacks' oder 'flat').
     * @returns {void}
     */
    setDockerView(view: DockerView): void {
      patchState(store, { dockerView: view });
      localStorage.setItem('ws2k_docker_view', view);
    },

    /**
     * Stellt den gespeicherten Docker-Anzeigemodus aus localStorage wieder her.
     * @description Wird beim App-Start in app.ts ngOnInit aufgerufen.
     *   Fallback: 'stacks' wenn kein Wert in localStorage gespeichert ist.
     * @returns {void}
     */
    restoreDockerView(): void {
      const saved = (localStorage.getItem('ws2k_docker_view') as DockerView) ?? 'stacks';
      patchState(store, { dockerView: saved });
    },
  })),
);

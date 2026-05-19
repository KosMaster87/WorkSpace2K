import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  pageTitle: string;
}

const initialState: AppState = {
  theme: 'dark',
  sidebarCollapsed: false,
  pageTitle: 'Dashboard',
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    toggleTheme(): void {
      const next: Theme = store.theme() === 'dark' ? 'light' : 'dark';
      patchState(store, { theme: next });
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ws2k_theme', next);
    },

    toggleSidebar(): void {
      patchState(store, { sidebarCollapsed: !store.sidebarCollapsed() });
    },

    setPageTitle(title: string): void {
      patchState(store, { pageTitle: title });
    },

    restoreTheme(): void {
      const saved = (localStorage.getItem('ws2k_theme') as Theme) ?? 'dark';
      patchState(store, { theme: saved });
      document.documentElement.setAttribute('data-theme', saved);
    },
  })),
);

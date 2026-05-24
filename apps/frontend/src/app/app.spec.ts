/**
 * @fileoverview App Root Component Tests
 * @description Prüft: Komponente erstellt, restoreSession dispatched, restoreTheme aufgerufen.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { App } from './app';
import { AppStore } from './store/app/app.store';
import { AuthActions } from './store/auth/auth.actions';

const mockAppStore = {
  restoreTheme: vi.fn(),
  sidebarCollapsed: vi.fn(() => false),
  theme: vi.fn(() => 'dark' as const),
  pageTitle: vi.fn(() => ''),
  toggleTheme: vi.fn(),
  toggleSidebar: vi.fn(),
  setPageTitle: vi.fn(),
};

describe('App', () => {
  let store: MockStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideMockStore(),
        provideRouter([]),
        { provide: AppStore, useValue: mockAppStore },
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should dispatch restoreSession on init', () => {
    const spy = vi.spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(AuthActions.restoreSession());
  });

  it('should call restoreTheme on init', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(mockAppStore.restoreTheme).toHaveBeenCalledOnce();
  });
});

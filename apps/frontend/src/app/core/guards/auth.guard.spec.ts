/**
 * @fileoverview authGuard Tests
 * @description Prüft: eingeloggte User durchgelassen, nicht-eingeloggte zu /login umgeleitet.
 */

import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

describe('authGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore(), provideRouter([])],
    });
    store = TestBed.inject(MockStore);
  });

  it('should return true when authenticated', async () => {
    store.overrideSelector(selectIsAuthenticated, true);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({} as any, {} as any) as Observable<boolean | UrlTree>),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login when not authenticated', async () => {
    store.overrideSelector(selectIsAuthenticated, false);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({} as any, {} as any) as Observable<boolean | UrlTree>),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

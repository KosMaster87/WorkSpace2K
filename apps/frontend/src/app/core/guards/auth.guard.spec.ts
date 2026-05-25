/**
 * @fileoverview authGuard Tests
 * @description Prüft: eingeloggte User durchgelassen, nicht-eingeloggte zu /login umgeleitet.
 *   Guard wartet auf selectAuthResolved = true bevor er entscheidet (Session Restore).
 */

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { selectAuthResolved, selectIsAuthenticated } from '../../store/auth/auth.selectors';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore(), provideRouter([])],
    });
    store = TestBed.inject(MockStore);
  });

  it('should return true when resolved and authenticated', async () => {
    store.overrideSelector(selectAuthResolved, true);
    store.overrideSelector(selectIsAuthenticated, true);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login when resolved but not authenticated', async () => {
    store.overrideSelector(selectAuthResolved, true);
    store.overrideSelector(selectIsAuthenticated, false);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

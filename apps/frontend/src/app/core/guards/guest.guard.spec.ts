/**
 * @fileoverview guestGuard Tests
 * @description Prüft: nicht-eingeloggte User durchgelassen, eingeloggte zu /dashboard umgeleitet.
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
import { guestGuard } from './guest.guard';
import { selectAuthResolved, selectIsAuthenticated } from '../../store/auth/auth.selectors';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('guestGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore(), provideRouter([])],
    });
    store = TestBed.inject(MockStore);
  });

  it('should return true when resolved and not authenticated (guest)', async () => {
    store.overrideSelector(selectAuthResolved, true);
    store.overrideSelector(selectIsAuthenticated, false);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(guestGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when resolved and already authenticated', async () => {
    store.overrideSelector(selectAuthResolved, true);
    store.overrideSelector(selectIsAuthenticated, true);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(guestGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});

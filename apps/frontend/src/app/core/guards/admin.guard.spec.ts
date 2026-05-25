/**
 * @fileoverview adminGuard Tests
 * @description Prüft: Admin durchgelassen, Non-Admin zu /dashboard umgeleitet.
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
import { adminGuard } from './admin.guard';
import { selectIsAdmin } from '../../store/auth/auth.selectors';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('adminGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore(), provideRouter([])],
    });
    store = TestBed.inject(MockStore);
  });

  it('should return true when user is admin', async () => {
    store.overrideSelector(selectIsAdmin, true);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(adminGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is not admin', async () => {
    store.overrideSelector(selectIsAdmin, false);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(adminGuard(mockRoute, mockState) as Observable<boolean | UrlTree>),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});

/**
 * @fileoverview guestGuard Tests
 * @description Prüft: nicht-eingeloggte User durchgelassen, eingeloggte zu /dashboard umgeleitet.
 */

import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { guestGuard } from './guest.guard';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

describe('guestGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore(), provideRouter([])],
    });
    store = TestBed.inject(MockStore);
  });

  it('should return true when not authenticated (guest)', async () => {
    store.overrideSelector(selectIsAuthenticated, false);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(guestGuard({} as any, {} as any) as Observable<boolean | UrlTree>),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when already authenticated', async () => {
    store.overrideSelector(selectIsAuthenticated, true);
    store.refreshState();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(guestGuard({} as any, {} as any) as Observable<boolean | UrlTree>),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});

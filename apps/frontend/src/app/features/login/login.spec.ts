/**
 * @fileoverview LoginComponent Tests
 * @description Prüft: Komponente erstellt, onSubmit dispatcht AuthActions.login,
 *   leere Felder dispatchen nicht, Signals für isLoading und error.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LoginComponent } from './login';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../store/auth/auth.selectors';

describe('LoginComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAuthLoading, value: false },
            { selector: selectAuthError, value: null },
          ],
        }),
        provideRouter([]),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with empty email and password', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should dispatch AuthActions.login with email and password on submit', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const spy = vi.spyOn(store, 'dispatch');

    component.email = 'test@example.com';
    component.password = 'secret';
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith(
      AuthActions.login({ email: 'test@example.com', password: 'secret' }),
    );
  });

  it('should not dispatch when email is empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const spy = vi.spyOn(store, 'dispatch');

    component.email = '';
    component.password = 'secret';
    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not dispatch when password is empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const spy = vi.spyOn(store, 'dispatch');

    component.email = 'test@example.com';
    component.password = '';
    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should reflect isLoading from store', () => {
    store.overrideSelector(selectAuthLoading, true);
    store.refreshState();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('should reflect error from store', () => {
    store.overrideSelector(selectAuthError, 'Invalid credentials');
    store.refreshState();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('Invalid credentials');
  });
});

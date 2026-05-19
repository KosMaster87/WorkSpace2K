import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly store = inject(Store);

  devLogin(): void {
    this.store.dispatch(
      AuthActions.loginSuccess({
        user: { id: '1', email: 'dev2k@local', name: 'Dev2K', role: 'admin' },
        token: 'dev-token',
      }),
    );
  }
}

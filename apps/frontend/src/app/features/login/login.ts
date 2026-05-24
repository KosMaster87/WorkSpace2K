/**
 * @fileoverview Login Feature — Authentifizierungs-Formular
 * @description Login-Seite mit E-Mail/Passwort-Formular.
 *   Dispatcht AuthActions.login → loginEffect sendet API-Request.
 *   Zeigt Loading-State und Fehlermeldung reaktiv via NgRx Signals.
 *   Formularfelder starten leer.
 * @module LoginComponent
 */

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../store/auth/auth.selectors';

/**
 * Login-Komponente mit E-Mail/Passwort-Formular.
 * @description Nutzt FormsModule für Two-Way-Binding ([(ngModel)]).
 *   isLoading und error sind Signals — automatische Change Detection ohne Zone.js.
 *   Submit disabled wenn: isLoading aktiv oder E-Mail/Passwort leer.
 * @class LoginComponent
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly store = inject(Store);

  /** Signal: true während Login-Request läuft. */
  readonly isLoading = this.store.selectSignal(selectAuthLoading);

  /** Signal: Fehlermeldung vom letzten Login-Versuch oder null. */
  readonly error = this.store.selectSignal(selectAuthError);

  email = '';
  password = '';

  /**
   * Dispatcht Login-Action mit E-Mail und Passwort.
   * @description Wird beim Form-Submit aufgerufen.
   *   Frühzeitiger Return wenn E-Mail oder Passwort leer (Fallback-Schutz).
   *   Der Button ist bereits disabled bei leerem Formular.
   * @returns {void}
   */
  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.store.dispatch(AuthActions.login({ email: this.email, password: this.password }));
  }
}

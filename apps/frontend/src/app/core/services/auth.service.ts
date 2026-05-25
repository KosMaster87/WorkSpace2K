/**
 * @fileoverview Auth Service — HTTP-Kommunikation mit der Auth-API
 * @description Kapselt alle HTTP-Aufrufe an /api/auth.
 *   Die API gibt Antworten im Format { data: { user, token } } zurück —
 *   dieser Service entpackt das data-Objekt via map(res => res.data).
 *   Token-Persistenz und Navigation übernehmen die NgRx Effects, nicht dieser Service.
 * @module AuthService
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../../store/auth/auth.state';

/**
 * Rückgabeformat der Auth-API nach dem Entpacken.
 */
interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Rohes API-Antwortformat (Backend gibt data-Wrapper zurück).
 * @private
 */
interface ApiAuthResponse {
  data: AuthResponse;
}

/**
 * Service für Authentifizierungs-HTTP-Anfragen.
 * @description Alle Methoden geben Observable zurück.
 *   Fehler werden nicht hier behandelt — sie propagieren zu den NgRx Effects,
 *   die loginFailure bzw. restoreSessionFailure dispatchen.
 * @class AuthService
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  /**
   * Sendet Login-Anfrage an POST /api/auth/login.
   * @description API gibt { data: { user, token } } zurück.
   *   Der data-Wrapper wird via map() entpackt.
   * @param {string} email - E-Mail-Adresse des Users.
   * @param {string} password - Plaintext-Passwort (geht verschlüsselt über HTTPS).
   * @returns {Observable<AuthResponse>} Entpackte Antwort mit user und token.
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<ApiAuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(map((res) => res.data));
  }

  /**
   * Stellt Session aus gespeichertem JWT wieder her via GET /api/auth/me.
   * @description Wird beim App-Start in app.ts ngOnInit dispatched.
   *   Der authInterceptor hängt den gespeicherten Token automatisch an.
   *   Bei 401 → restoreSessionFailure → Auth-State leer → authGuard leitet zu /login.
   * @returns {Observable<AuthResponse>} Aktueller User und frisch signierter Token.
   */
  restoreSession(): Observable<AuthResponse> {
    return this.http.get<ApiAuthResponse>(`${this.apiUrl}/me`).pipe(map((res) => res.data));
  }

  /**
   * Sendet Logout-Anfrage an POST /api/auth/logout.
   * @description Token-Entfernung aus localStorage übernimmt logoutEffect.
   *   Der Backend-Endpunkt existiert noch nicht — Platzhalter für zukünftige Token-Invalidierung.
   * @returns {Observable<void>} Leere Antwort nach erfolgreichem Logout.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }
}

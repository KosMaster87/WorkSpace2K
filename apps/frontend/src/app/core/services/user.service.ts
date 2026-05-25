/**
 * @fileoverview User Service — HTTP-Kommunikation mit der Users-API
 * @description Kapselt alle HTTP-Aufrufe an /api/users.
 *   Der authInterceptor hängt den JWT automatisch an.
 *   Alle Endpunkte sind Admin-only (adminOnly Middleware im Backend).
 *   Fehler propagieren zu den NgRx Effects (catchError dort, nicht hier).
 * @module UserService
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '@workspace2k/shared';

/** Payload für neuen User. */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

/** API-Antwortformat für User-Listen. */
interface ApiUsersResponse {
  data: User[];
}

/** API-Antwortformat für einzelnen User. */
interface ApiUserResponse {
  data: User;
}

/**
 * HTTP-Service für User-Management-Endpunkte.
 * @description Alle Methoden geben Observables zurück.
 *   Fehler propagieren zu den UsersEffects.
 * @class UserService
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  /**
   * Gibt alle User zurück.
   * @description GET /api/users — sortiert nach createdAt aufsteigend.
   * @returns {Observable<User[]>} Liste aller User.
   */
  getUsers(): Observable<User[]> {
    return this.http.get<ApiUsersResponse>(this.apiUrl).pipe(map((res) => res.data));
  }

  /**
   * Legt einen neuen User an.
   * @description POST /api/users
   * @param {CreateUserPayload} payload - Name, E-Mail, Passwort, Rolle.
   * @returns {Observable<User>} Neu angelegter User.
   */
  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http.post<ApiUserResponse>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  /**
   * Ändert die Rolle eines Users.
   * @description PATCH /api/users/:id/role
   * @param {string} id - User-ID.
   * @param {'ADMIN' | 'USER'} role - Neue Rolle.
   * @returns {Observable<User>} Aktualisierter User.
   */
  updateUserRole(id: string, role: 'ADMIN' | 'USER'): Observable<User> {
    return this.http
      .patch<ApiUserResponse>(`${this.apiUrl}/${id}/role`, { role })
      .pipe(map((res) => res.data));
  }

  /**
   * Löscht einen User.
   * @description DELETE /api/users/:id — HTTP 204 No Content.
   * @param {string} id - User-ID.
   * @returns {Observable<void>}
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

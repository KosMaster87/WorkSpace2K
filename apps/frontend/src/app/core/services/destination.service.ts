/**
 * @fileoverview Destination Service — HTTP-Kommunikation mit der Destinations-API
 * @description Kapselt alle HTTP-Aufrufe an /api/destinations.
 *   Der authInterceptor hängt den JWT automatisch an.
 *   GET ist für alle eingeloggten User zugänglich.
 *   POST, PATCH, DELETE sind Admin-only (adminOnly Middleware im Backend).
 *   Fehler propagieren zu den NgRx Effects (catchError dort, nicht hier).
 * @module DestinationService
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Destination } from '@workspace2k/shared';

/** Payload zum Anlegen einer neuen Destination. */
export interface CreateDestinationPayload {
  name: string;
  url: string;
  icon?: string;
  category?: string;
  description?: string;
  sortOrder?: number;
}

/** Payload zum Bearbeiten einer bestehenden Destination (alle Felder optional). */
export interface UpdateDestinationPayload {
  name?: string;
  url?: string;
  icon?: string;
  category?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** API-Antwortformat für Destinations-Listen. */
interface ApiDestinationsResponse {
  data: Destination[];
}

/** API-Antwortformat für eine einzelne Destination. */
interface ApiDestinationResponse {
  data: Destination;
}

/**
 * HTTP-Service für Destinations-Endpunkte.
 * @description Alle Methoden geben Observables zurück.
 *   Fehler propagieren zu den DestinationsEffects.
 * @class DestinationService
 */
@Injectable({ providedIn: 'root' })
export class DestinationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/destinations';

  /**
   * Gibt alle aktiven Destinations zurück, sortiert nach sortOrder und name.
   * @description GET /api/destinations
   * @returns {Observable<Destination[]>} Liste aller aktiven Destinations.
   */
  getDestinations(): Observable<Destination[]> {
    return this.http.get<ApiDestinationsResponse>(this.apiUrl).pipe(map((res) => res.data));
  }

  /**
   * Legt eine neue Destination an.
   * @description POST /api/destinations — nur ADMIN.
   * @param {CreateDestinationPayload} payload - Name, URL und optionale Felder.
   * @returns {Observable<Destination>} Neu angelegte Destination.
   */
  createDestination(payload: CreateDestinationPayload): Observable<Destination> {
    return this.http
      .post<ApiDestinationResponse>(this.apiUrl, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Aktualisiert eine bestehende Destination.
   * @description PATCH /api/destinations/:id — nur ADMIN.
   * @param {string} id - Destination-ID.
   * @param {UpdateDestinationPayload} payload - Zu ändernde Felder.
   * @returns {Observable<Destination>} Aktualisierte Destination.
   */
  updateDestination(id: string, payload: UpdateDestinationPayload): Observable<Destination> {
    return this.http
      .patch<ApiDestinationResponse>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Löscht eine Destination.
   * @description DELETE /api/destinations/:id — HTTP 204 No Content.
   * @param {string} id - Destination-ID.
   * @returns {Observable<void>}
   */
  deleteDestination(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

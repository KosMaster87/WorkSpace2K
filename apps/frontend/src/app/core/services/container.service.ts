/**
 * @fileoverview Container Service — HTTP-Kommunikation mit der Docker API
 * @description Kapselt alle HTTP-Aufrufe an /api/docker.
 *   Der authInterceptor hängt den JWT automatisch an jeden Request.
 *   API-Antwortformat: { data: ... } — dieser Service entpackt das data-Objekt.
 *   Fehler propagieren zu den NgRx Effects (catchError dort, nicht hier).
 * @module ContainerService
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Container } from '../../store/docker/docker.state';

/**
 * Rohes API-Antwortformat für die Container-Liste.
 * @private
 */
interface ApiContainersResponse {
  data: Container[];
}

/**
 * HTTP-Service für Container-Management-Endpunkte.
 * @description Alle Methoden geben Observables zurück.
 *   Fehler werden nicht hier behandelt — sie propagieren zu den DockerEffects.
 * @class ContainerService
 */
@Injectable({ providedIn: 'root' })
export class ContainerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/docker';

  /**
   * Lädt alle Docker-Container (laufend + gestoppt).
   * @description GET /api/docker/containers — entpackt data-Array.
   * @returns {Observable<Container[]>} Liste aller Container.
   */
  getContainers(): Observable<Container[]> {
    return this.http
      .get<ApiContainersResponse>(`${this.apiUrl}/containers`)
      .pipe(map((res) => res.data));
  }

  /**
   * Startet einen gestoppten Container.
   * @description POST /api/docker/containers/:id/start
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @returns {Observable<void>}
   */
  startContainer(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/containers/${id}/start`, {});
  }

  /**
   * Stoppt einen laufenden Container.
   * @description POST /api/docker/containers/:id/stop
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @returns {Observable<void>}
   */
  stopContainer(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/containers/${id}/stop`, {});
  }
}

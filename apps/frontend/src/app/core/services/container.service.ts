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
import {
  ComposeStack,
  ContainerStats,
  DockerService,
  DockerStack,
  StackUpdateResult,
} from '@workspace2k/shared';

/**
 * Rohes API-Antwortformat für die Container-Liste.
 * @private
 */
interface ApiContainersResponse {
  data: DockerService[];
}

/**
 * Rohes API-Antwortformat für Compose-Stacks (Filesystem-Scan).
 * @private
 */
interface ApiComposeStacksResponse {
  data: ComposeStack[];
}

/**
 * Rohes API-Antwortformat für Stack-Update-Ergebnis.
 * @private
 */
interface ApiStackUpdateResponse {
  data: StackUpdateResult;
}

/**
 * Rohes API-Antwortformat für die Stacks-Liste.
 * @private
 */
interface ApiStacksResponse {
  data: DockerStack[];
}

/**
 * Rohes API-Antwortformat für Container-Stats.
 * @private
 */
interface ApiStatsResponse {
  data: ContainerStats;
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
   * @returns {Observable<DockerService[]>} Liste aller Container.
   */
  getContainers(): Observable<DockerService[]> {
    return this.http
      .get<ApiContainersResponse>(`${this.apiUrl}/containers`)
      .pipe(map((res) => res.data));
  }

  /**
   * Lädt CPU, RAM und Uptime eines einzelnen Containers.
   * @description GET /api/docker/containers/:id/stats — nur für laufende Container sinnvoll.
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @returns {Observable<ContainerStats>} CPU %, RAM, Uptime.
   */
  getContainerStats(id: string): Observable<ContainerStats> {
    return this.http
      .get<ApiStatsResponse>(`${this.apiUrl}/containers/${id}/stats`)
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

  /**
   * Löscht einen gestoppten Container.
   * @description DELETE /api/docker/containers/:id — HTTP 204 No Content.
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @returns {Observable<void>}
   */
  removeContainer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/containers/${id}`);
  }

  /**
   * Gibt die letzten Log-Zeilen eines Containers zurück.
   * @description GET /api/docker/containers/:id/logs?tail=<tail>
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @param {number} [tail=100] - Anzahl der letzten Zeilen.
   * @returns {Observable<string[]>} Array der Log-Zeilen.
   */
  getContainerLogs(id: string, tail: number = 100): Observable<string[]> {
    return this.http
      .get<{ data: string[] }>(`${this.apiUrl}/containers/${id}/logs`, {
        params: { tail: tail.toString() },
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Lädt alle Docker-Stacks (Container nach Compose-Projekt gruppiert).
   * @description GET /api/docker/stacks — entpackt data-Array.
   * @returns {Observable<DockerStack[]>} Liste aller Stacks.
   */
  getStacks(): Observable<DockerStack[]> {
    return this.http.get<ApiStacksResponse>(`${this.apiUrl}/stacks`).pipe(map((res) => res.data));
  }

  /**
   * Startet alle gestoppten Container eines Stacks.
   * @description POST /api/docker/stacks/:name/start
   * @param {string} name - Docker Compose Projekt-Name.
   * @returns {Observable<void>}
   */
  startStack(name: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/stacks/${encodeURIComponent(name)}/start`, {});
  }

  /**
   * Stoppt alle laufenden Container eines Stacks.
   * @description POST /api/docker/stacks/:name/stop
   * @param {string} name - Docker Compose Projekt-Name.
   * @returns {Observable<void>}
   */
  stopStack(name: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/stacks/${encodeURIComponent(name)}/stop`, {});
  }

  /**
   * Scannt das Server-Stacks-Verzeichnis nach Compose-Files (Filesystem-Scan).
   * @description GET /api/docker/stacks/scan — gibt gefundene Compose-Stacks zurück.
   *   Gibt leeres Array zurück wenn DOCKER_STACKS_PATH nicht existiert.
   * @returns {Observable<ComposeStack[]>} Gefundene Compose-Stacks.
   */
  scanComposeStacks(): Observable<ComposeStack[]> {
    return this.http
      .get<ApiComposeStacksResponse>(`${this.apiUrl}/stacks/scan`)
      .pipe(map((res) => res.data));
  }

  /**
   * Aktualisiert einen Stack via docker compose pull && up -d.
   * @description POST /api/docker/stacks/:name/update
   *   Lädt neue Images und startet Container neu. Kann mehrere Minuten dauern.
   * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
   * @returns {Observable<StackUpdateResult>} Name + Ausgabe der Befehle.
   */
  updateStack(name: string): Observable<StackUpdateResult> {
    return this.http
      .post<ApiStackUpdateResponse>(`${this.apiUrl}/stacks/${encodeURIComponent(name)}/update`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * Liest den YAML-Inhalt der Compose-Datei eines Stacks.
   * @description GET /api/docker/stacks/:name/compose
   *   Wird für den Compose-File-Editor genutzt (Edit-Modus).
   * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
   * @returns {Observable<string>} YAML-Inhalt der Compose-Datei.
   */
  getComposeContent(name: string): Observable<string> {
    return this.http
      .get<{ data: string }>(`${this.apiUrl}/stacks/${encodeURIComponent(name)}/compose`)
      .pipe(map((res) => res.data));
  }

  /**
   * Speichert den Compose-Datei-Inhalt und deployed den Stack via docker compose up -d.
   * @description PUT /api/docker/stacks/:name/compose
   *   Überschreibt die vorhandene Compose-Datei und startet den Stack neu.
   *   Kann mehrere Minuten dauern (Image-Download).
   * @param {string} name - Stack-Name (= Verzeichnisname in DOCKER_STACKS_PATH).
   * @param {string} content - Neuer YAML-Inhalt der Compose-Datei.
   * @returns {Observable<StackUpdateResult>} Name + Ausgabe des Deployments.
   */
  saveAndDeployStack(name: string, content: string): Observable<StackUpdateResult> {
    return this.http
      .put<ApiStackUpdateResponse>(`${this.apiUrl}/stacks/${encodeURIComponent(name)}/compose`, {
        content,
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Erstellt einen neuen Stack (Verzeichnis + compose.yaml + docker compose up -d).
   * @description POST /api/docker/stacks
   *   Erstellt das Stack-Verzeichnis in DOCKER_STACKS_PATH, schreibt compose.yaml
   *   und startet den Stack via docker compose up -d.
   * @param {string} name - Neuer Stack-Name (nur a-z, 0-9, _ und -).
   * @param {string} content - YAML-Inhalt der compose.yaml.
   * @returns {Observable<StackUpdateResult>} Name + Ausgabe des Deployments.
   */
  createStack(name: string, content: string): Observable<StackUpdateResult> {
    return this.http
      .post<ApiStackUpdateResponse>(`${this.apiUrl}/stacks`, { name, content })
      .pipe(map((res) => res.data));
  }

  /**
   * Öffnet einen SSE-Stream für Live-Logs eines Containers.
   * @description GET /api/docker/containers/:id/logs/stream
   *   Nutzt fetch() + ReadableStream statt EventSource, damit der normale
   *   Authorization-Bearer-Header gesendet werden kann (EventSource unterstützt
   *   keine Custom-Header). Die SSE-Zeilen werden manuell geparst.
   *   Das Observable bricht den fetch-Request via AbortController beim Unsubscribe ab.
   *   Für gestoppte Container schließt der Stream nach den Tail-Zeilen sofort (complete).
   *   Für laufende Container bleibt er offen bis unsubscribe() aufgerufen wird.
   * @param {string} id - Container-ID (kurz, 12 Zeichen).
   * @param {number} [tail=100] - Anzahl der letzten Zeilen als Ausgangspunkt.
   * @returns {Observable<string>} Jede emittierte Log-Zeile als String.
   */
  streamContainerLogs(id: string, tail: number = 100): Observable<string> {
    return new Observable<string>((observer) => {
      const token = localStorage.getItem('ws2k_token') ?? '';
      const url = `${this.apiUrl}/containers/${encodeURIComponent(id)}/logs/stream?tail=${tail}`;
      const abort = new AbortController();

      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abort.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            observer.error(new Error(`Log-Stream Fehler: HTTP ${response.status}`));
            return;
          }
          if (!response.body) {
            observer.error(new Error('Kein Response-Body'));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                observer.complete();
                break;
              }
              buf += decoder.decode(value, { stream: true });

              // SSE-Protokoll: Zeilen aufsplitten, data:-Zeilen emittieren
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  observer.next(line.slice(6));
                }
              }
            }
          } catch (err) {
            // AbortError ist kein echter Fehler — complete statt error
            if (!abort.signal.aborted) observer.error(err);
            else if (!observer.closed) observer.complete();
          }
        })
        .catch((err: unknown) => {
          if (!abort.signal.aborted) observer.error(err);
        });

      // Teardown: AbortController bricht den laufenden fetch ab
      return () => abort.abort();
    });
  }
}

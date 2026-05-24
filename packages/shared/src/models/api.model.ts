/**
 * @fileoverview API Model — Geteilte HTTP-Response-Typen
 * @description Standardisierte Antwort-Typen für alle API-Endpunkte.
 *   ApiResponse<T> ist das Basis-Format aller erfolgreichen Antworten: { data: T }.
 *   Backend gibt immer ApiResponse zurück — Frontend entpackt data in Services via map(res => res.data).
 * @module ApiModel
 */

/**
 * Standard-Antwortformat für erfolgreiche API-Anfragen.
 * @template T - Typ der zurückgegebenen Daten.
 * @interface ApiResponse
 */
export interface ApiResponse<T> {
  /** Die eigentlichen Antwortdaten. */
  data: T;
  /** Optionale Zusatznachricht (z.B. 'Login successful'). */
  message?: string;
}

/**
 * Standard-Fehlerformat für fehlgeschlagene API-Anfragen.
 * @interface ApiError
 */
export interface ApiError {
  /** Fehlermeldung für den Client. */
  message: string;
  /** HTTP-Statuscode (z.B. 401, 404, 500). */
  statusCode: number;
}

/**
 * Paginiertes Antwortformat für Listen-Endpunkte.
 * @template T - Typ der Listenelemente.
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** Array der Seiten-Elemente. */
  data: T[];
  /** Gesamtanzahl aller Elemente (nicht nur der aktuellen Seite). */
  total: number;
  /** Aktuelle Seitennummer (1-basiert). */
  page: number;
  /** Maximale Anzahl Elemente pro Seite. */
  limit: number;
}

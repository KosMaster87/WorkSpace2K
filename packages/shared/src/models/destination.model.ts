/**
 * @fileoverview Destination Model — Geteilte Typen für Service-Destinations
 * @description Definiert Destination, CreateDestinationPayload und UpdateDestinationPayload.
 *   Wird für die Destinations-Page und die Destinations-API genutzt.
 *   Eine Destination ist ein selbst-gehosteter Web-Service mit URL und optionalem Icon.
 * @module DestinationModel
 */

/**
 * Repräsentiert einen konfigurierten Web-Service (Destination).
 * @interface Destination
 */
export interface Destination {
  /** Eindeutige Destination-ID (CUID). */
  id: string;
  /** Anzeigename des Services (z.B. 'Nginx Proxy Manager'). */
  name: string;
  /** URL über die der Service erreichbar ist (z.B. 'http://localhost:81'). */
  url: string;
  /** Optionales Emoji-Icon oder URL zu einem Favicon. */
  icon?: string;
  /** Optionale Kategorie für die Gruppierung (z.B. 'Infrastruktur', 'DevOps'). */
  category?: string;
  /** Optionale Kurzbeschreibung des Services. */
  description?: string;
  /** Reihenfolge innerhalb der Kategorie (aufsteigend). */
  sortOrder: number;
  /** false = ausgeblendet aber nicht gelöscht. */
  isActive: boolean;
  /** ISO-Timestamp der Erstellung. */
  createdAt: string;
  /** ISO-Timestamp der letzten Änderung. */
  updatedAt: string;
}

/**
 * Payload zum Anlegen einer neuen Destination.
 * @interface CreateDestinationPayload
 */
export interface CreateDestinationPayload {
  /** Anzeigename (Pflichtfeld). */
  name: string;
  /** URL (Pflichtfeld). */
  url: string;
  /** Optionales Emoji oder Icon-URL. */
  icon?: string;
  /** Optionale Kategorie. */
  category?: string;
  /** Optionale Beschreibung. */
  description?: string;
  /** Optionale Sortierreihenfolge (Standard: 0). */
  sortOrder?: number;
}

/**
 * Payload zum Bearbeiten einer bestehenden Destination.
 * @description Alle Felder optional — nur übermittelte Felder werden geändert (PATCH).
 * @interface UpdateDestinationPayload
 */
export interface UpdateDestinationPayload {
  /** Neuer Anzeigename. */
  name?: string;
  /** Neue URL. */
  url?: string;
  /** Neues Icon. */
  icon?: string;
  /** Neue Kategorie. */
  category?: string;
  /** Neue Beschreibung. */
  description?: string;
  /** Neue Sortierreihenfolge. */
  sortOrder?: number;
  /** Sichtbarkeit umschalten. */
  isActive?: boolean;
}

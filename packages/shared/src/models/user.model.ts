/**
 * @fileoverview User Model — Geteilte User-Typen für Frontend und Backend
 * @description Definiert User-Interface und UserRole-Typ.
 *   Wird im Frontend für den Auth-State und im Backend für API-Antworten genutzt.
 *   Prisma-Schema: Role ist uppercase (ADMIN/USER) — API gibt lowercase zurück.
 * @module UserModel
 */

/**
 * User-Rolle — lowercase wie vom Backend zurückgegeben.
 */
export type UserRole = 'admin' | 'user';

/**
 * Repräsentiert einen User in der Applikation.
 * @interface User
 */
export interface User {
  /** Eindeutige User-ID (CUID aus PostgreSQL). */
  id: string;
  /** E-Mail-Adresse — eindeutig in der Datenbank. */
  email: string;
  /** Anzeigename des Users. */
  name: string;
  /** Rolle — bestimmt Zugriff auf Admin-Features. */
  role: UserRole;
  /** Optionaler Avatar-URL. */
  avatar?: string;
  /** ISO-Timestamp der Erstellung. */
  createdAt?: string;
}

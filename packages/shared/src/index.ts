/**
 * @fileoverview @workspace2k/shared — Öffentliche API des Shared Package
 * @description Zentrale Export-Datei für alle geteilten TypeScript-Interfaces.
 *   Wird von Frontend (@app/*) und Backend (@workspace2k/shared) importiert.
 *   Stellt sicher dass beide Seiten dieselben Typen verwenden.
 * @module SharedPackage
 */

export * from './models/user.model';
export * from './models/service.model';
export * from './models/api.model';

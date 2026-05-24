/**
 * @fileoverview Users Feature — Benutzerverwaltung (nur ADMIN)
 * @description Seite zur Verwaltung von Applikations-Usern — geschützt durch adminGuard.
 *   Geplant: User CRUD via User Management API.
 * @module UsersComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Benutzerverwaltungs-Seite — nur für ADMIN-User zugänglich.
 * @description Setzt beim Laden den Seitentitel im Header.
 *   Zugriff durch adminGuard in app.routes.ts geschützt.
 * @class UsersComponent
 */
@Component({
  selector: 'app-users',
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  /**
   * Setzt den Seitentitel beim Laden der Seite.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Users');
  }
}

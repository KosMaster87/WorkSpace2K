/**
 * @fileoverview Settings Feature — App-Konfiguration (nur ADMIN)
 * @description Einstellungsseite — geschützt durch adminGuard.
 *   Geplant: App-weite Konfiguration via Settings API.
 * @module SettingsComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Einstellungsseite — nur für ADMIN-User zugänglich.
 * @description Setzt beim Laden den Seitentitel im Header.
 *   Zugriff durch adminGuard in app.routes.ts geschützt.
 * @class SettingsComponent
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  /**
   * Setzt den Seitentitel beim Laden der Seite.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Settings');
  }
}

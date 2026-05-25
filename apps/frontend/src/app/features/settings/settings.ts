/**
 * @fileoverview Settings Feature — App-Konfiguration
 * @description Einstellungsseite — geschützt durch adminGuard.
 *   Aktuell: Darstellungs-Einstellungen (Theme dark/light).
 *   Theme-State liegt im AppStore (NgRx Signal Store) — toggleTheme()
 *   speichert die Auswahl in localStorage und setzt data-theme auf <html>.
 * @module SettingsComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Einstellungsseite — nur für ADMIN-User zugänglich.
 * @description Zeigt App-weite Einstellungen: Theme-Auswahl, App-Info.
 *   Zugriff durch adminGuard in app.routes.ts geschützt.
 * @class SettingsComponent
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  readonly appStore = inject(AppStore);

  /**
   * Setzt den Seitentitel beim Laden der Seite.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Settings');
  }
}

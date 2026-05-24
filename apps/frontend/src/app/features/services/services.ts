/**
 * @fileoverview Services Feature — Docker-Container-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Geplant: Container starten/stoppen via POST /api/docker/containers/:id/start|stop.
 * @module ServicesComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Services-Seite — Liste und Steuerung von Docker-Containern.
 * @description Setzt beim Laden den Seitentitel im Header.
 *   Inhalt: Noch in Entwicklung — Docker API Integration folgt.
 * @class ServicesComponent
 */
@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  /**
   * Setzt den Seitentitel beim Laden der Seite.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
  }
}

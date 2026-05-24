/**
 * @fileoverview Dashboard Feature — Übersichtsseite
 * @description Hauptseite nach dem Login. Zeigt Service-Kacheln mit Live-Status.
 *   Docker API Integration geplant: GET /api/docker/containers.
 * @module DashboardComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Dashboard-Seite — Übersicht aller Docker-Services.
 * @description Setzt beim Laden den Seitentitel im Header.
 *   Inhalt: Noch in Entwicklung — Docker-Service-Kacheln folgen.
 * @class DashboardComponent
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  /**
   * Setzt den Seitentitel beim Laden der Seite.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Dashboard');
  }
}

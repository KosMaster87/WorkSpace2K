/**
 * @fileoverview Dashboard Feature — Service-Kacheln mit Live-Status
 * @description Hauptseite nach dem Login. Lädt Container-Liste aus dem NgRx Docker-Store
 *   und zeigt sie als Service-Tiles in einem responsive Grid an.
 *   Dispatcht loadContainers beim Initialisieren — Effect holt Daten von /api/docker/containers.
 * @module DashboardComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectDockerError,
  selectDockerLoading,
  selectRunningCount,
  selectStoppedCount,
} from '../../store/docker/docker.selectors';

/**
 * Dashboard-Seite — Übersicht aller Docker-Services als Kacheln.
 * @description Nutzt NgRx Store für Container-Daten (Signals via selectSignal).
 *   loadContainers wird einmalig beim Init dispatcht.
 *   Kacheln zeigen: Name, Status-Badge, Image, Port (optional).
 * @class DashboardComponent
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly appStore = inject(AppStore);

  /** Signal: Liste aller Container. */
  readonly containers = this.store.selectSignal(selectAllContainers);

  /** Signal: true während die Liste geladen wird. */
  readonly isLoading = this.store.selectSignal(selectDockerLoading);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDockerError);

  /** Signal: Anzahl laufender Container. */
  readonly runningCount = this.store.selectSignal(selectRunningCount);

  /** Signal: Anzahl gestoppter Container. */
  readonly stoppedCount = this.store.selectSignal(selectStoppedCount);

  /**
   * Setzt den Seitentitel und lädt die Container-Liste.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Dashboard');
    this.store.dispatch(DockerActions.loadContainers());
  }
}

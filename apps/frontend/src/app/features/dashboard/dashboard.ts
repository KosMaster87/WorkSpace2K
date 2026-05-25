/**
 * @fileoverview Dashboard Feature — Service-Kacheln mit Live-Status und Stats
 * @description Hauptseite nach dem Login. Lädt Container-Liste und Stats aus dem NgRx Docker-Store
 *   und zeigt sie als Service-Tiles in einem responsive Grid an.
 *   Dispatcht loadContainers beim Initialisieren — Effect holt Daten von /api/docker/containers.
 *   Stats (CPU, RAM, Uptime) werden automatisch nach loadContainersSuccess geladen (Effect).
 * @module DashboardComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ContainerStats } from '@workspace2k/shared';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectAllStats,
  selectDockerError,
  selectDockerLoading,
  selectRunningCount,
  selectStoppedCount,
} from '../../store/docker/docker.selectors';

/**
 * Dashboard-Seite — Übersicht aller Docker-Services als Kacheln.
 * @description Nutzt NgRx Store für Container-Daten und Stats (Signals via selectSignal).
 *   loadContainers wird einmalig beim Init dispatcht.
 *   Kacheln zeigen: Name, Status-Badge, Image, Port (optional).
 *   Laufende Container zeigen zusätzlich CPU %, RAM-Nutzung und Uptime.
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

  /** Signal: Record id → ContainerStats für alle laufenden Container. */
  readonly stats = this.store.selectSignal(selectAllStats);

  /** Signal: true während die Liste geladen wird. */
  readonly isLoading = this.store.selectSignal(selectDockerLoading);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDockerError);

  /** Signal: Anzahl laufender Container. */
  readonly runningCount = this.store.selectSignal(selectRunningCount);

  /** Signal: Anzahl gestoppter Container. */
  readonly stoppedCount = this.store.selectSignal(selectStoppedCount);

  /**
   * Gibt die Stats eines einzelnen Containers zurück oder null wenn noch nicht geladen.
   * @description Liest aus dem stats-Signal (Record<string, ContainerStats>).
   *   Gibt null zurück wenn der Container gestoppt ist oder Stats noch laden.
   * @param {string} id - Container-ID (12 Zeichen).
   * @returns {ContainerStats | null} Stats-Objekt oder null.
   */
  statsFor(id: string): ContainerStats | null {
    return this.stats()[id] ?? null;
  }

  /**
   * Setzt den Seitentitel und lädt die Container-Liste.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Dashboard');
    this.store.dispatch(DockerActions.loadContainers());
  }
}

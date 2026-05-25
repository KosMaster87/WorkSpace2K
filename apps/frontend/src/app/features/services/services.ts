/**
 * @fileoverview Services Feature — Docker-Container- und Stack-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Zeigt Container als flache Tabelle oder als Stack-Karten (je nach dockerView im AppStore).
 *   Die Ansicht wird in Settings gesetzt und in localStorage persistiert.
 *   Dispatcht loadContainers beim Init — Stacks werden automatisch danach geladen (Effect).
 * @module ServicesComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectAllLogs,
  selectAllStacks,
  selectDockerError,
  selectDockerLoading,
  selectLogsPendingIds,
  selectPendingIds,
  selectStackPendingNames,
  selectStacksLoading,
} from '../../store/docker/docker.selectors';

/**
 * Services-Seite — Liste und Steuerung von Docker-Containern und Stacks.
 * @description Zeigt je nach AppStore.dockerView entweder:
 *   - 'stacks': Container gruppiert nach Compose-Projekt als aufklappbare Karten
 *   - 'flat': Flache Tabelle aller Container mit Start/Stop/Delete/Logs
 *   Delete verwendet zweistufige Bestätigung (requestDelete → confirmDelete).
 *   Logs werden on-demand geladen und im aufklappbaren Panel angezeigt.
 * @class ServicesComponent
 */
@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private readonly store = inject(Store);
  readonly appStore = inject(AppStore);

  /** Signal: Liste aller Container (für Flat-Ansicht). */
  readonly containers = this.store.selectSignal(selectAllContainers);

  /** Signal: true während die Container-Liste initial geladen wird. */
  readonly isLoading = this.store.selectSignal(selectDockerLoading);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDockerError);

  /** Signal: IDs mit laufenden Start/Stop/Remove-Requests. */
  readonly pendingIds = this.store.selectSignal(selectPendingIds);

  /** Signal: Record id → string[] mit geladenen Log-Zeilen. */
  readonly allLogs = this.store.selectSignal(selectAllLogs);

  /** Signal: IDs mit laufenden Log-Requests. */
  readonly logsPendingIds = this.store.selectSignal(selectLogsPendingIds);

  /** Signal: Liste aller Stacks (für Stack-Ansicht). */
  readonly stacks = this.store.selectSignal(selectAllStacks);

  /** Signal: true während die Stacks geladen werden. */
  readonly stacksLoading = this.store.selectSignal(selectStacksLoading);

  /** Signal: Namen von Stacks mit laufenden Start/Stop-Requests. */
  readonly stackPendingNames = this.store.selectSignal(selectStackPendingNames);

  /** ID des Containers dessen Löschung bestätigt werden muss (null = kein Confirm). */
  confirmDeleteId: string | null = null;

  /** ID des Containers dessen Logs gerade angezeigt werden (null = keines offen). */
  openLogsId: string | null = null;

  /**
   * Setzt den Seitentitel und lädt Container (Stacks folgen automatisch via Effect).
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
    this.store.dispatch(DockerActions.loadContainers());
  }

  /**
   * Prüft ob für diesen Container gerade ein Start/Stop/Remove-Request läuft.
   * @param {string} id - Container-ID.
   * @returns {boolean}
   */
  isPending(id: string): boolean {
    return this.pendingIds().includes(id);
  }

  /**
   * Gibt die geladenen Log-Zeilen für einen Container zurück.
   * @param {string} id - Container-ID.
   * @returns {string[]} Log-Zeilen oder leeres Array.
   */
  getLogs(id: string): string[] {
    return this.allLogs()[id] ?? [];
  }

  /**
   * Prüft ob gerade Logs für diesen Container geladen werden.
   * @param {string} id - Container-ID.
   * @returns {boolean}
   */
  isLogsLoading(id: string): boolean {
    return this.logsPendingIds().includes(id);
  }

  /**
   * Öffnet oder schließt das Log-Panel für einen Container.
   * @description Lädt Logs beim ersten Öffnen. Beim zweiten Klick: Panel schließen.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  toggleLogs(id: string): void {
    if (this.openLogsId === id) {
      this.openLogsId = null;
      return;
    }
    this.openLogsId = id;
    if (!this.allLogs()[id]) {
      this.store.dispatch(DockerActions.loadContainerLogs({ id }));
    }
  }

  /**
   * Startet den ersten Schritt der Delete-Bestätigung.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  requestDelete(id: string): void {
    this.confirmDeleteId = id;
  }

  /**
   * Bricht die Delete-Bestätigung ab.
   * @returns {void}
   */
  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  /**
   * Bestätigt und führt das Löschen des Containers durch.
   * @returns {void}
   */
  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.store.dispatch(DockerActions.removeContainer({ id: this.confirmDeleteId }));
    this.confirmDeleteId = null;
  }

  /**
   * Dispatcht startContainer für einen einzelnen Container.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  onStart(id: string): void {
    this.store.dispatch(DockerActions.startContainer({ id }));
  }

  /**
   * Dispatcht stopContainer für einen einzelnen Container.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  onStop(id: string): void {
    this.store.dispatch(DockerActions.stopContainer({ id }));
  }

  /**
   * Prüft ob für diesen Stack gerade ein Start/Stop-Request läuft.
   * @param {string} name - Stack-Name.
   * @returns {boolean}
   */
  isStackPending(name: string): boolean {
    return this.stackPendingNames().includes(name);
  }

  /**
   * Startet alle Container eines Stacks.
   * @param {string} name - Stack-Name (Compose-Projekt).
   * @returns {void}
   */
  onStartStack(name: string): void {
    this.store.dispatch(DockerActions.startStack({ name }));
  }

  /**
   * Stoppt alle Container eines Stacks.
   * @param {string} name - Stack-Name (Compose-Projekt).
   * @returns {void}
   */
  onStopStack(name: string): void {
    this.store.dispatch(DockerActions.stopStack({ name }));
  }
}

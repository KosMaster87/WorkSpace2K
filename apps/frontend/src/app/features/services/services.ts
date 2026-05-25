/**
 * @fileoverview Services Feature — Docker-Container-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Zeigt alle Container in einer Tabelle mit Start/Stop/Delete-Buttons und Log-Panel.
 *   Dispatcht loadContainers beim Init und startContainer/stopContainer/removeContainer per Button-Klick.
 *   Buttons sind disabled während ein Pending-Request für diesen Container läuft.
 * @module ServicesComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectAllLogs,
  selectDockerError,
  selectDockerLoading,
  selectLogsPendingIds,
  selectPendingIds,
} from '../../store/docker/docker.selectors';

/**
 * Services-Seite — Liste und Steuerung von Docker-Containern.
 * @description Zeigt Container-Tabelle mit Status-Badges, Start/Stop/Delete-Buttons und Log-Panel.
 *   isPending(id) prüft ob ein Container gerade gestartet oder gestoppt wird.
 *   Delete verwendet zweistufige Bestätigung (requestDelete → confirmDelete).
 *   Logs werden on-demand geladen und im aufklappbaren Panel darunter angezeigt.
 * @class ServicesComponent
 */
@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly appStore = inject(AppStore);

  /** Signal: Liste aller Container. */
  readonly containers = this.store.selectSignal(selectAllContainers);

  /** Signal: true während die Liste initial geladen wird. */
  readonly isLoading = this.store.selectSignal(selectDockerLoading);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDockerError);

  /** Signal: IDs mit laufenden Start/Stop/Remove-Requests. */
  readonly pendingIds = this.store.selectSignal(selectPendingIds);

  /** Signal: Record id → string[] mit geladenen Log-Zeilen. */
  readonly allLogs = this.store.selectSignal(selectAllLogs);

  /** Signal: IDs mit laufenden Log-Requests. */
  readonly logsPendingIds = this.store.selectSignal(selectLogsPendingIds);

  /** ID des Containers dessen Löschung bestätigt werden muss (null = kein Confirm). */
  confirmDeleteId: string | null = null;

  /** ID des Containers dessen Logs gerade angezeigt werden (null = keines offen). */
  openLogsId: string | null = null;

  /**
   * Setzt den Seitentitel und lädt Container.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
    this.store.dispatch(DockerActions.loadContainers());
  }

  /**
   * Prüft ob für diesen Container gerade ein Start/Stop/Remove-Request läuft.
   * @description Wird im Template genutzt um Buttons zu deaktivieren.
   * @param {string} id - Container-ID.
   * @returns {boolean} true wenn der Container pending ist.
   */
  isPending(id: string): boolean {
    return this.pendingIds().includes(id);
  }

  /**
   * Gibt die geladenen Log-Zeilen für einen Container zurück.
   * @param {string} id - Container-ID.
   * @returns {string[]} Log-Zeilen oder leeres Array wenn noch nicht geladen.
   */
  getLogs(id: string): string[] {
    return this.allLogs()[id] ?? [];
  }

  /**
   * Prüft ob gerade Logs für diesen Container geladen werden.
   * @param {string} id - Container-ID.
   * @returns {boolean} true wenn ein Log-Request läuft.
   */
  isLogsLoading(id: string): boolean {
    return this.logsPendingIds().includes(id);
  }

  /**
   * Öffnet oder schließt das Log-Panel für einen Container.
   * @description Lädt Logs beim ersten Öffnen via loadContainerLogs-Action.
   *   Beim zweiten Klick wird das Panel geschlossen (Toggle).
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
   * @description Dispatcht removeContainer nur wenn confirmDeleteId gesetzt ist.
   * @returns {void}
   */
  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.store.dispatch(DockerActions.removeContainer({ id: this.confirmDeleteId }));
    this.confirmDeleteId = null;
  }

  /**
   * Dispatcht startContainer-Action für den angegebenen Container.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  onStart(id: string): void {
    this.store.dispatch(DockerActions.startContainer({ id }));
  }

  /**
   * Dispatcht stopContainer-Action für den angegebenen Container.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  onStop(id: string): void {
    this.store.dispatch(DockerActions.stopContainer({ id }));
  }
}

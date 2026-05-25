/**
 * @fileoverview Services Feature — Docker-Container-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Zeigt alle Container in einer Tabelle mit Start/Stop-Buttons.
 *   Dispatcht loadContainers beim Init und startContainer/stopContainer per Button-Klick.
 *   Buttons sind disabled während ein Pending-Request für diesen Container läuft.
 * @module ServicesComponent
 */

import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectDockerError,
  selectDockerLoading,
  selectPendingIds,
} from '../../store/docker/docker.selectors';

/**
 * Services-Seite — Liste und Steuerung von Docker-Containern.
 * @description Zeigt Container-Tabelle mit Status-Badges und Start/Stop-Buttons.
 *   isPending(id) prüft ob ein Container gerade gestartet oder gestoppt wird.
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

  /** Signal: IDs mit laufenden Start/Stop-Requests. */
  readonly pendingIds = this.store.selectSignal(selectPendingIds);

  /**
   * Setzt den Seitentitel und lädt Container.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
    this.store.dispatch(DockerActions.loadContainers());
  }

  /**
   * Prüft ob für diesen Container gerade ein Request läuft.
   * @description Wird im Template genutzt um Buttons zu deaktivieren.
   * @param {string} id - Container-ID.
   * @returns {boolean} true wenn der Container pending ist.
   */
  isPending(id: string): boolean {
    return this.pendingIds().includes(id);
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

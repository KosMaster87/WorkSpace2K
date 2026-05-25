/**
 * @fileoverview Services Feature — Docker-Container- und Stack-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Zeigt Container als flache Tabelle oder als Stack-Karten (je nach dockerView im AppStore).
 *   Die Ansicht wird in Settings gesetzt und in localStorage persistiert.
 *   Dispatcht loadContainers beim Init — Stacks werden automatisch danach geladen (Effect).
 *   Live-Logs: SSE-Stream via ContainerService.streamContainerLogs() — kein NgRx Store,
 *   da Streaming-Daten lokal in Signals gehalten werden.
 * @module ServicesComponent
 */

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ContainerService } from '../../core/services/container.service';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import {
  selectAllContainers,
  selectAllStacks,
  selectDockerError,
  selectDockerLoading,
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
 *   Logs werden per SSE-Stream in Echtzeit angezeigt (liveLines Signal).
 *   Der Stream wird beim Öffnen gestartet und beim Schließen automatisch beendet.
 * @class ServicesComponent
 */
@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly containerService = inject(ContainerService);
  private readonly destroyRef = inject(DestroyRef);
  readonly appStore = inject(AppStore);

  /** Signal: Liste aller Container (für Flat-Ansicht). */
  readonly containers = this.store.selectSignal(selectAllContainers);

  /** Signal: true während die Container-Liste initial geladen wird. */
  readonly isLoading = this.store.selectSignal(selectDockerLoading);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDockerError);

  /** Signal: IDs mit laufenden Start/Stop/Remove-Requests. */
  readonly pendingIds = this.store.selectSignal(selectPendingIds);

  /** Signal: Liste aller Stacks (für Stack-Ansicht). */
  readonly stacks = this.store.selectSignal(selectAllStacks);

  /** Signal: true während die Stacks geladen werden. */
  readonly stacksLoading = this.store.selectSignal(selectStacksLoading);

  /** Signal: Namen von Stacks mit laufenden Start/Stop-Requests. */
  readonly stackPendingNames = this.store.selectSignal(selectStackPendingNames);

  /**
   * Live-Log-Zeilen pro Container-ID.
   * @description Wird vom SSE-Stream befüllt. Max. 500 Zeilen pro Container.
   */
  readonly liveLines = signal<Record<string, string[]>>({});

  /**
   * IDs von Containern mit offener SSE-Verbindung.
   * @description Wird für den "● LIVE"-Indikator im Log-Panel genutzt.
   */
  readonly streamingIds = signal<string[]>([]);

  /** Aktive SSE-Subscriptions — Key: Container-ID. */
  private readonly liveStreams = new Map<string, Subscription>();

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
   * Gibt die Live-Log-Zeilen für einen Container zurück.
   * @param {string} id - Container-ID.
   * @returns {string[]} Log-Zeilen vom SSE-Stream oder leeres Array.
   */
  getLogs(id: string): string[] {
    return this.liveLines()[id] ?? [];
  }

  /**
   * Prüft ob für diesen Container gerade ein SSE-Stream offen ist.
   * @param {string} id - Container-ID.
   * @returns {boolean}
   */
  isStreaming(id: string): boolean {
    return this.streamingIds().includes(id);
  }

  /**
   * Öffnet oder schließt das Log-Panel für einen Container.
   * @description Startet einen SSE-Stream beim Öffnen, beendet ihn beim Schließen.
   *   Zweiter Klick auf den gleichen Container schließt das Panel.
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  toggleLogs(id: string): void {
    if (this.openLogsId === id) {
      this.closeLogs(id);
      return;
    }
    this.openLogsId = id;
    this.startStream(id);
  }

  /**
   * Startet den SSE-Log-Stream für einen Container.
   * @description Zeilen werden in liveLines Signal akkumuliert (max. 500 Zeilen).
   *   Stream bleibt offen bis closeLogs() aufgerufen wird oder der Container stoppt.
   * @private
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  private startStream(id: string): void {
    if (this.liveStreams.has(id)) return;

    this.liveLines.update((rec) => ({ ...rec, [id]: [] }));
    this.streamingIds.update((ids) => [...ids, id]);

    const sub = this.containerService
      .streamContainerLogs(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (line: string) => {
          this.liveLines.update((rec) => {
            const prev = rec[id] ?? [];
            // Max. 500 Zeilen im Speicher halten
            const next = prev.length >= 500 ? prev.slice(1) : prev;
            return { ...rec, [id]: [...next, line] };
          });
        },
        error: () => {
          this.streamingIds.update((ids) => ids.filter((s) => s !== id));
          this.liveStreams.delete(id);
        },
        complete: () => {
          // Stream vom Server geschlossen (z.B. Container gestoppt)
          this.streamingIds.update((ids) => ids.filter((s) => s !== id));
          this.liveStreams.delete(id);
        },
      });

    this.liveStreams.set(id, sub);
  }

  /**
   * Schließt das Log-Panel und beendet den SSE-Stream.
   * @private
   * @param {string} id - Container-ID.
   * @returns {void}
   */
  private closeLogs(id: string): void {
    this.openLogsId = null;
    const sub = this.liveStreams.get(id);
    if (sub) {
      sub.unsubscribe();
      this.liveStreams.delete(id);
    }
    this.streamingIds.update((ids) => ids.filter((s) => s !== id));
    this.liveLines.update((rec) => {
      const next = { ...rec };
      delete next[id];
      return next;
    });
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

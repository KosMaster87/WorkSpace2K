/**
 * @fileoverview Services Feature — Docker-Container- und Stack-Verwaltung
 * @description Seite zur Verwaltung laufender Docker-Services.
 *   Zeigt Container als flache Tabelle oder als Stack-Karten (je nach dockerView im AppStore).
 *   Die Ansicht wird in Settings gesetzt und in localStorage persistiert.
 *   Dispatcht loadContainers beim Init — Stacks werden automatisch danach geladen (Effect).
 *   Live-Logs: SSE-Stream via ContainerService.streamContainerLogs() — kein NgRx Store,
 *   da Streaming-Daten lokal in Signals gehalten werden.
 *   Compose-Editor: lokaler Signal-State (kein NgRx) — öffnet sich als Modal-Overlay.
 *   Zwei Modi: 'create' (neuer Stack) und 'edit' (vorhandene Compose-Datei bearbeiten).
 *   Auto-Destination: Im Create-Modus optional gleichzeitig eine Destination anlegen.
 * @module ServicesComponent
 */

import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ContainerService } from '../../core/services/container.service';
import { calcDownloadMinutes, SPEED_PRESETS, STACK_INFO, StackInfo } from './stack-info.config';
import { applyTemplate, STACK_TEMPLATES, StackTemplate } from './stack-templates.config';
import { AppStore } from '../../store/app/app.store';
import { DockerActions } from '../../store/docker/docker.actions';
import { DestinationsActions } from '../../store/destinations/destinations.actions';
import {
  selectAllContainers,
  selectComposeStacks,
  selectDockerError,
  selectDockerLoading,
  selectMergedStacks,
  selectPendingIds,
  selectStackPendingNames,
  selectStackStartingNames,
  selectStackUpdatingNames,
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
  imports: [DecimalPipe],
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

  /** Signal: Alle Stacks — laufende (Docker API) + gestoppte (Filesystem-Scan) zusammengeführt. */
  readonly stacks = this.store.selectSignal(selectMergedStacks);

  /** Signal: true während die Stacks geladen werden. */
  readonly stacksLoading = this.store.selectSignal(selectStacksLoading);

  /** Signal: Namen von Stacks mit laufenden Start/Stop-Requests. */
  readonly stackPendingNames = this.store.selectSignal(selectStackPendingNames);

  /** Signal: Namen von Stacks, bei denen gerade ein Update (pull + up -d) läuft. */
  readonly stackUpdatingNames = this.store.selectSignal(selectStackUpdatingNames);

  /** Signal: Namen von Stacks die gestartet wurden aber noch nicht in docker ps erscheinen (Image-Pull). */
  readonly stackStartingNames = this.store.selectSignal(selectStackStartingNames);

  /** Signal: Compose-Stacks aus dem Filesystem-Scan. */
  readonly composeStacks = this.store.selectSignal(selectComposeStacks);

  // ── Compose-Editor State ────────────────────────────────────────────────────

  /** true = Editor-Overlay ist sichtbar. */
  /** Stack-Name dessen Info-Panel gerade offen ist (null = keines). */
  readonly openInfoStack = signal<string | null>(null);

  /** Geschwindigkeits-Presets für die Download-Zeit-Tabelle. */
  readonly speedPresets = SPEED_PRESETS;

  /** Alle verfügbaren Stack-Templates. */
  readonly stackTemplates = STACK_TEMPLATES;

  /** Aktuell ausgewähltes Template (null = keines / manuell). */
  readonly selectedTemplate = signal<StackTemplate | null>(null);

  readonly editorOpen = signal(false);

  /** 'create' = neuer Stack, 'edit' = vorhandene Compose-Datei bearbeiten. */
  readonly editorMode = signal<'create' | 'edit'>('create');

  /** Stack-Name im Editor (readonly in edit-Modus, editierbar in create-Modus). */
  readonly editorStackName = signal('');

  /** YAML-Inhalt im Editor-Textarea. */
  readonly editorContent = signal('');

  /** true während der Compose-Datei-Inhalt vom Server geladen wird (edit-Modus). */
  readonly editorLoading = signal(false);

  /** true während des Deployments (PUT oder POST request läuft). */
  readonly editorSaving = signal(false);

  /** Fehlermeldung im Editor oder null. */
  readonly editorError = signal<string | null>(null);

  /** Ausgabe (stdout/stderr) nach erfolgreichem Deploy oder null. */
  readonly deployOutput = signal<string | null>(null);

  // ── Auto-Destination State (nur Create-Modus) ───────────────────────────────

  /**
   * true = Destination nach dem Deploy automatisch anlegen.
   * @description Nur im Create-Modus sichtbar. Nach erfolgreichem Deploy wird
   *   DestinationsActions.createDestination dispatcht.
   */
  readonly destEnabled = signal(false);

  /** URL der neuen Destination (Pflichtfeld wenn destEnabled). */
  readonly destUrl = signal('');

  /** Optionales Emoji-Icon der Destination (z.B. '🐳'). */
  readonly destIcon = signal('');

  /** Optionale Kategorie der Destination (z.B. 'Infrastruktur'). */
  readonly destCategory = signal('');

  // ── Live-Log State ──────────────────────────────────────────────────────────

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
   * Setzt den Seitentitel, lädt Container und scannt Compose-Stacks.
   * @description Container-Laden löst Stack-Laden via Effect aus.
   *   Compose-Scan läuft parallel — gibt [] wenn /opt/stacks nicht existiert.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
    this.store.dispatch(DockerActions.loadContainers());
    this.store.dispatch(DockerActions.scanComposeStacks());
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
   * Prüft ob für diesen Stack gerade ein Update läuft.
   * @param {string} name - Stack-Name.
   * @returns {boolean}
   */
  isStackUpdating(name: string): boolean {
    return this.stackUpdatingNames().includes(name);
  }

  /**
   * Prüft ob dieser Stack gestartet wurde aber noch Image-Pull läuft (noch nicht in docker ps).
   * @param {string} name - Stack-Name.
   * @returns {boolean}
   */
  isStackStarting(name: string): boolean {
    return this.stackStartingNames().includes(name);
  }

  /**
   * Gibt die Stack-Info für einen Stack zurück oder null wenn keine vorhanden.
   * @param {string} name - Stack-Name.
   * @returns {StackInfo | null}
   */
  stackInfo(name: string): StackInfo | null {
    return STACK_INFO[name] ?? null;
  }

  /**
   * Berechnet die Download-Zeit in Minuten bei gegebener Geschwindigkeit.
   * @param {number} downloadMb - Image-Größe komprimiert in MB.
   * @param {number} speedMbit - Verbindungsgeschwindigkeit in Mbit/s.
   * @returns {string} Formatierte Zeit (z.B. "4 Min" oder "0.5 Min").
   */
  downloadTime(downloadMb: number, speedMbit: number): string {
    const minutes = calcDownloadMinutes(downloadMb, speedMbit);
    return minutes < 1 ? `${(minutes * 60) | 0} Sek` : `~${minutes} Min`;
  }

  /**
   * Öffnet oder schließt das Info-Panel eines Stacks.
   * @param {string} name - Stack-Name.
   */
  toggleInfo(name: string): void {
    this.openInfoStack.update((current) => (current === name ? null : name));
  }

  /**
   * Wählt ein Template aus und befüllt den Editor — Stack-Name-Prefix wird gesetzt.
   * @param {StackTemplate | null} template - Template oder null für manuellen Modus.
   */
  selectTemplate(template: StackTemplate | null): void {
    this.selectedTemplate.set(template);
    if (template) {
      const currentName = this.editorStackName();
      const bare = currentName.startsWith(template.namePrefix + '-')
        ? currentName.slice(template.namePrefix.length + 1)
        : currentName;
      const fullName = bare ? `${template.namePrefix}-${bare}` : '';
      this.editorStackName.set(fullName);
      this.editorContent.set(bare ? applyTemplate(template.compose, bare) : template.compose);
    }
  }

  /**
   * Aktualisiert Stack-Name und YAML live wenn ein Template aktiv ist.
   * @description Setzt Stack-Name auf `<prefix>-<eingabe>` und ersetzt {{name}} im YAML.
   * @param {string} rawName - Roheingabe des Users (ohne Prefix).
   */
  onTemplateNameInput(rawName: string): void {
    const template = this.selectedTemplate();
    if (!template) {
      this.editorStackName.set(rawName);
      return;
    }
    const clean = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    this.editorStackName.set(clean ? `${template.namePrefix}-${clean}` : '');
    this.editorContent.set(clean ? applyTemplate(template.compose, clean) : template.compose);
  }

  /**
   * Prüft ob für diesen Stack ein Compose-File auf dem Server gefunden wurde.
   * @description Vergleicht Stack-Name mit dem Filesystem-Scan-Ergebnis.
   * @param {string} name - Stack-Name.
   * @returns {boolean} true wenn Compose-File vorhanden → Update-Button sichtbar.
   */
  hasComposeFile(name: string): boolean {
    return this.composeStacks().some((s) => s.name === name);
  }

  /**
   * Dispatcht updateStack für einen Stack.
   * @description Führt docker compose pull && up -d im Stack-Verzeichnis aus.
   *   Kann mehrere Minuten dauern. Lädt danach Container und Stacks neu.
   * @param {string} name - Stack-Name.
   * @returns {void}
   */
  onUpdateStack(name: string): void {
    this.store.dispatch(DockerActions.updateStack({ name }));
  }

  // ── Compose-Editor Methoden ─────────────────────────────────────────────────

  /**
   * Öffnet den Editor im Create-Modus (neuer Stack).
   * @description Setzt alle Editor-Felder und Destination-Felder zurück auf Standardwerte.
   * @returns {void}
   */
  openCreateEditor(): void {
    this.editorMode.set('create');
    this.editorStackName.set('');
    this.editorContent.set('');
    this.editorError.set(null);
    this.deployOutput.set(null);
    this.editorLoading.set(false);
    this.editorSaving.set(false);
    this.destEnabled.set(false);
    this.destUrl.set('');
    this.destIcon.set('');
    this.destCategory.set('');
    this.editorOpen.set(true);
  }

  /**
   * Öffnet den Editor im Edit-Modus und lädt die Compose-Datei des Stacks.
   * @description Lädt den YAML-Inhalt der Compose-Datei vom Server.
   *   Zeigt editorLoading während des Ladens.
   * @param {string} name - Stack-Name.
   * @returns {void}
   */
  openEditEditor(name: string): void {
    this.editorMode.set('edit');
    this.editorStackName.set(name);
    this.editorContent.set('');
    this.editorError.set(null);
    this.deployOutput.set(null);
    this.editorLoading.set(true);
    this.editorSaving.set(false);
    this.editorOpen.set(true);

    this.containerService
      .getComposeContent(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.editorContent.set(content);
          this.editorLoading.set(false);
        },
        error: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : 'Compose-Datei konnte nicht geladen werden';
          this.editorError.set(msg);
          this.editorLoading.set(false);
        },
      });
  }

  /**
   * Schließt den Editor und setzt alle Felder zurück.
   * @returns {void}
   */
  closeEditor(): void {
    this.editorOpen.set(false);
    this.editorError.set(null);
    this.deployOutput.set(null);
    this.selectedTemplate.set(null);
  }

  /**
   * Speichert und deployed den Stack (create oder edit).
   * @description Create-Modus: POST /api/docker/stacks (neues Verzeichnis + up -d).
   *   Edit-Modus: PUT /api/docker/stacks/:name/compose (Datei überschreiben + up -d).
   *   Nach erfolgreichem Deploy: Container und Stacks im Store neu laden.
   * @returns {void}
   */
  onDeploy(): void {
    const name = this.editorStackName().trim();
    const content = this.editorContent();
    if (!name) {
      this.editorError.set('Stack-Name ist erforderlich.');
      return;
    }
    if (!content.trim()) {
      this.editorError.set('Compose-Inhalt ist erforderlich.');
      return;
    }

    this.editorSaving.set(true);
    this.editorError.set(null);
    this.deployOutput.set(null);

    const template = this.selectedTemplate();
    const bare = template ? name.slice(template.namePrefix.length + 1) : name;
    const templateExtras =
      this.editorMode() === 'create' && template
        ? {
            ws2k: applyTemplate(template.ws2k, bare),
            envExample: template.envExample,
          }
        : undefined;

    const request$ =
      this.editorMode() === 'create'
        ? this.containerService.createStack(name, content, templateExtras)
        : this.containerService.saveAndDeployStack(name, content);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.deployOutput.set(result.output || '✓ Erfolgreich deployed.');
        this.editorSaving.set(false);
        // Nach erfolgreichem Deploy Container und Stacks neu laden
        this.store.dispatch(DockerActions.loadContainers());
        this.store.dispatch(DockerActions.scanComposeStacks());
        // Auto-Destination: nur im Create-Modus wenn aktiviert und URL gesetzt
        if (this.editorMode() === 'create' && this.destEnabled() && this.destUrl().trim()) {
          this.store.dispatch(
            DestinationsActions.createDestination({
              payload: {
                name: name,
                url: this.destUrl().trim(),
                icon: this.destIcon().trim() || undefined,
                category: this.destCategory().trim() || undefined,
              },
            }),
          );
        }
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Deploy fehlgeschlagen';
        this.editorError.set(msg);
        this.editorSaving.set(false);
      },
    });
  }

  // ── Stack-Aktionen ──────────────────────────────────────────────────────────

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

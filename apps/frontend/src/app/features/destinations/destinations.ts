/**
 * @fileoverview Destinations Feature — Schnellzugriff auf Self-hosted Services
 * @description Zeigt alle konfigurierten Web-Services als Kacheln, gruppiert nach Kategorie.
 *   Klick auf eine Kachel öffnet den Service in einem neuen Tab.
 *   Admins können Destinations anlegen, bearbeiten und löschen.
 *   Admin-Buttons sind nur sichtbar wenn user.role === 'admin'.
 * @module DestinationsComponent
 */

import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Destination } from '@workspace2k/shared';
import { AppStore } from '../../store/app/app.store';
import { selectUser } from '../../store/auth/auth.selectors';
import { DestinationsActions } from '../../store/destinations/destinations.actions';
import {
  selectAllDestinations,
  selectDestinationsCreating,
  selectDestinationsError,
  selectDestinationsLoading,
  selectDestinationsPendingIds,
  selectGroupedDestinations,
} from '../../store/destinations/destinations.selectors';
import {
  CreateDestinationPayload,
  UpdateDestinationPayload,
} from '../../core/services/destination.service';

/**
 * Destinations-Seite — Kachel-Ansicht aller konfigurierten Services.
 * @description Lädt Destinations beim Init, zeigt sie gruppiert nach Kategorie.
 *   Formular-State (showForm, newDest, editingId) ist lokal — kein Store-Overhead.
 *   Delete-Bestätigung: confirmDeleteId speichert die ID der zu löschenden Destination.
 * @class DestinationsComponent
 */
@Component({
  selector: 'app-destinations',
  templateUrl: './destinations.html',
  styleUrl: './destinations.scss',
  imports: [FormsModule],
})
export class DestinationsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly appStore = inject(AppStore);

  /** Signal: Aktuell eingeloggter User (für Admin-Check). */
  readonly user = this.store.selectSignal(selectUser);

  /** Computed: true wenn eingeloggter User ein Admin ist. */
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  /** Signal: Alle Destinations (flache Liste). */
  readonly destinations = this.store.selectSignal(selectAllDestinations);

  /** Signal: Destinations gruppiert nach Kategorie für die Kachel-Ansicht. */
  readonly groups = this.store.selectSignal(selectGroupedDestinations);

  /** Signal: true während GET /api/destinations läuft. */
  readonly isLoading = this.store.selectSignal(selectDestinationsLoading);

  /** Signal: true während POST /api/destinations läuft. */
  readonly isCreating = this.store.selectSignal(selectDestinationsCreating);

  /** Signal: IDs mit laufendem Update/Delete. */
  readonly pendingIds = this.store.selectSignal(selectDestinationsPendingIds);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectDestinationsError);

  /** Steuert Sichtbarkeit des Anlegen-Formulars. */
  showForm = false;

  /** ID der Destination die gerade bearbeitet wird (null = keine). */
  editingId: string | null = null;

  /** ID der Destination die gerade gelöscht werden soll (Bestätigungs-Step). */
  confirmDeleteId: string | null = null;

  /** Formular-Werte für neue oder bearbeitete Destination. */
  formData: CreateDestinationPayload = {
    name: '',
    url: '',
    icon: '',
    category: '',
    description: '',
    sortOrder: 0,
  };

  /**
   * Setzt den Seitentitel und lädt die Destinations-Liste.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Destinations');
    this.store.dispatch(DestinationsActions.loadDestinations());
  }

  /**
   * Öffnet das Anlegen-Formular (zurückgesetzt).
   * @returns {void}
   */
  openCreateForm(): void {
    this.editingId = null;
    this.formData = { name: '', url: '', icon: '', category: '', description: '', sortOrder: 0 };
    this.showForm = true;
  }

  /**
   * Öffnet das Formular im Edit-Modus für eine bestehende Destination.
   * @param {Destination} dest - Die zu bearbeitende Destination.
   * @returns {void}
   */
  openEditForm(dest: Destination): void {
    this.editingId = dest.id;
    this.formData = {
      name: dest.name,
      url: dest.url,
      icon: dest.icon ?? '',
      category: dest.category ?? '',
      description: dest.description ?? '',
      sortOrder: dest.sortOrder,
    };
    this.showForm = true;
  }

  /**
   * Schließt das Formular.
   * @returns {void}
   */
  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  /**
   * Dispatcht createDestination oder updateDestination je nach Modus.
   * @returns {void}
   */
  submitForm(): void {
    if (!this.formData.name || !this.formData.url) return;

    const payload: CreateDestinationPayload = {
      ...this.formData,
      icon: this.formData.icon || undefined,
      category: this.formData.category || undefined,
      description: this.formData.description || undefined,
    };

    if (this.editingId) {
      const updatePayload: UpdateDestinationPayload = payload;
      this.store.dispatch(
        DestinationsActions.updateDestination({ id: this.editingId, payload: updatePayload }),
      );
    } else {
      this.store.dispatch(DestinationsActions.createDestination({ payload }));
    }

    this.closeForm();
  }

  /**
   * Öffnet den Service in einem neuen Browser-Tab.
   * @param {string} url - URL der Destination.
   * @returns {void}
   */
  openService(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Aktiviert den Delete-Bestätigungs-Step.
   * @param {string} id - Destination-ID.
   * @returns {void}
   */
  requestDelete(id: string): void {
    this.confirmDeleteId = id;
  }

  /**
   * Bricht den Delete-Bestätigungs-Step ab.
   * @returns {void}
   */
  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  /**
   * Bestätigt das Löschen und dispatcht deleteDestination.
   * @returns {void}
   */
  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.store.dispatch(DestinationsActions.deleteDestination({ id: this.confirmDeleteId }));
    this.confirmDeleteId = null;
  }

  /**
   * Gibt true zurück wenn für die Destination-ID gerade ein Request läuft.
   * @param {string} id - Destination-ID.
   * @returns {boolean}
   */
  isPending(id: string): boolean {
    return this.pendingIds().includes(id);
  }
}

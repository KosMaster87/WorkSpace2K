/**
 * @fileoverview Users Feature — Benutzerverwaltung (nur ADMIN)
 * @description Seite zur Verwaltung aller Applikations-User.
 *   Zeigt User-Tabelle, erlaubt Anlegen, Rolle-Ändern und Löschen.
 *   Geschützt durch adminGuard — nur ADMIN-User haben Zugriff.
 *   Formular-State ist lokal (kein Store) — nur die User-Liste kommt aus NgRx.
 * @module UsersComponent
 */

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { User } from '@workspace2k/shared';
import { AppStore } from '../../store/app/app.store';
import { UsersActions } from '../../store/users/users.actions';
import {
  selectAllUsers,
  selectUsersCreating,
  selectUsersError,
  selectUsersLoading,
  selectUsersPendingIds,
} from '../../store/users/users.selectors';

/**
 * Benutzerverwaltungs-Seite — nur für ADMIN-User zugänglich.
 * @description Lädt User-Liste beim Init, erlaubt CRUD-Operationen.
 *   Formular-State (showForm, newUser) ist lokal — kein Overhead im Store.
 *   Delete-Bestätigung: confirmDeleteId speichert die ID des zu löschenden Users.
 * @class UsersComponent
 */
@Component({
  selector: 'app-users',
  templateUrl: './users.html',
  styleUrl: './users.scss',
  imports: [FormsModule, DatePipe],
})
export class UsersComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly appStore = inject(AppStore);

  /** Signal: Liste aller User. */
  readonly users = this.store.selectSignal(selectAllUsers);

  /** Signal: true während die Liste geladen wird. */
  readonly isLoading = this.store.selectSignal(selectUsersLoading);

  /** Signal: true während POST /api/users läuft. */
  readonly isCreating = this.store.selectSignal(selectUsersCreating);

  /** Signal: IDs mit laufendem Request (Role-Change oder Delete). */
  readonly pendingIds = this.store.selectSignal(selectUsersPendingIds);

  /** Signal: Fehlermeldung oder null. */
  readonly error = this.store.selectSignal(selectUsersError);

  /** Steuert Sichtbarkeit des Anlegen-Formulars. */
  showForm = false;

  /** ID des Users der gerade gelöscht werden soll (Bestätigungs-Step). */
  confirmDeleteId: string | null = null;

  /** Formular-Werte für neuen User. */
  newUser = { name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER' };

  /**
   * Setzt den Seitentitel und lädt die User-Liste.
   * @returns {void}
   */
  ngOnInit(): void {
    this.appStore.setPageTitle('Users');
    this.store.dispatch(UsersActions.loadUsers());
  }

  /**
   * Öffnet das Anlegen-Formular und setzt es zurück.
   * @returns {void}
   */
  openForm(): void {
    this.newUser = { name: '', email: '', password: '', role: 'USER' };
    this.showForm = true;
  }

  /**
   * Schließt das Anlegen-Formular.
   * @returns {void}
   */
  closeForm(): void {
    this.showForm = false;
  }

  /**
   * Dispatcht createUser mit den Formular-Werten.
   * @description Formular schließt sich nach dem Dispatch — Reducer fügt neuen
   *   User direkt in die Liste ein (optimistic update via Effect + Success-Action).
   * @returns {void}
   */
  submitCreate(): void {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) return;
    this.store.dispatch(UsersActions.createUser({ payload: { ...this.newUser } }));
    this.showForm = false;
  }

  /**
   * Dispatcht updateUserRole für einen einzelnen User.
   * @param {User} user - User dessen Rolle geändert werden soll.
   * @param {string} role - Neue Rolle aus dem Select-Element.
   * @returns {void}
   */
  changeRole(user: User, role: string): void {
    if (role !== 'ADMIN' && role !== 'USER') return;
    this.store.dispatch(UsersActions.updateUserRole({ id: user.id, role }));
  }

  /**
   * Aktiviert den Delete-Bestätigungs-Step für einen User.
   * @param {string} id - User-ID.
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
   * Bestätigt das Löschen und dispatcht deleteUser.
   * @returns {void}
   */
  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.store.dispatch(UsersActions.deleteUser({ id: this.confirmDeleteId }));
    this.confirmDeleteId = null;
  }

  /**
   * Gibt true zurück wenn für die User-ID gerade ein Request läuft.
   * @param {string} id - User-ID.
   * @returns {boolean}
   */
  isPending(id: string): boolean {
    return this.pendingIds().includes(id);
  }
}

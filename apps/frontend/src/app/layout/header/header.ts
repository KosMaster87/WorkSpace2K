/**
 * @fileoverview Header Component — Obere Navigationsleiste
 * @description Zeigt Seitentitel und Theme-Toggle.
 *   Liest pageTitle und Theme-Zustand aus dem AppStore (Signal Store).
 * @module HeaderComponent
 */

import { Component, inject } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

/**
 * Obere Navigationsleiste der App-Shell.
 * @description Zugriff auf AppStore als public — Template bindet direkt daran.
 *   Seitentitel kommt aus appStore.pageTitle(), wird von Feature-Komponenten via setPageTitle() gesetzt.
 * @class HeaderComponent
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  /** AppStore-Instanz — für Template-Zugriff auf pageTitle und toggleTheme. */
  readonly appStore = inject(AppStore);
}

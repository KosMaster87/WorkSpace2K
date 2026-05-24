/**
 * @fileoverview App Shell — Haupt-Layout für eingeloggte User
 * @description Wrapper-Komponente für alle geschützten Routen.
 *   Enthält Sidebar, Header und RouterOutlet für Feature-Komponenten.
 *   Wird in app.routes.ts als Parent-Route für alle authGuard-Routen verwendet.
 * @module AppShellComponent
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';

/**
 * Layout-Shell für den eingeloggten Bereich.
 * @description Statische Layout-Komponente — keine eigene Logik.
 *   Layout-Struktur: Sidebar links | Header oben | RouterOutlet (Inhalt)
 * @class AppShellComponent
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent {}

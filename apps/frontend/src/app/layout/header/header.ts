import { Component, inject } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

@Component({
  selector: 'app-header',

  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly appStore = inject(AppStore);
}

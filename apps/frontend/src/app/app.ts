import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './store/app/app.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.restoreTheme();
  }
}

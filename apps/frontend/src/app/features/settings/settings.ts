import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.setPageTitle('Settings');
  }
}

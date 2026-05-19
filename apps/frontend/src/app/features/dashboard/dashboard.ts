import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.setPageTitle('Dashboard');
  }
}

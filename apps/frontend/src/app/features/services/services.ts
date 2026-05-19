import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.setPageTitle('Services');
  }
}

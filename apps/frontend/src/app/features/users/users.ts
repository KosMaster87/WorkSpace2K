import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from '../../store/app/app.store';

@Component({
  selector: 'app-users',
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.setPageTitle('Users');
  }
}

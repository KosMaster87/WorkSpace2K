import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStore } from '../../store/app/app.store';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectUser } from '../../store/auth/auth.selectors';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',

  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private readonly store = inject(Store);
  readonly appStore = inject(AppStore);
  readonly user = this.store.selectSignal(selectUser);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⊞', route: '/dashboard' },
    { label: 'Services', icon: '⚙', route: '/services' },
    { label: 'Docker', icon: '🐳', route: '/docker' },
    { label: 'Monitoring', icon: '📊', route: '/monitoring' },
    { label: 'Backups', icon: '💾', route: '/backups' },
    { label: 'Settings', icon: '⚡', route: '/settings', adminOnly: true },
    { label: 'Users', icon: '👥', route: '/users', adminOnly: true },
  ];

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

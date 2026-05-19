import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

// Redirects already-logged-in users away from /login
export const guestGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuth) => !isAuth || router.createUrlTree(['/dashboard'])),
  );
};

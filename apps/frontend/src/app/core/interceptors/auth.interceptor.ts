import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take } from 'rxjs';
import { selectToken } from '../../store/auth/auth.selectors';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  return store.select(selectToken).pipe(
    take(1),
    switchMap((token) => {
      if (!token) return next(req);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};

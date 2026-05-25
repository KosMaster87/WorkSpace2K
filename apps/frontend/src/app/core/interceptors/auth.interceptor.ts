/**
 * @fileoverview Auth HTTP Interceptor — JWT automatisch an Requests anhängen
 * @description Funktionaler HttpInterceptor der den JWT-Token aus dem NgRx Store liest
 *   und ihn als Authorization-Header an jeden ausgehenden HTTP-Request hängt.
 *   Requests ohne Token werden unverändert weitergeleitet.
 * @module AuthInterceptor
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take } from 'rxjs';
import { selectToken } from '../../store/auth/auth.selectors';

/**
 * Hängt den JWT-Bearer-Token an jeden ausgehenden HTTP-Request.
 * @description Liest den Token einmalig aus dem NgRx Store (take(1)).
 *   Kein Token → Request wird unverändert weitergeleitet.
 *   Mit Token → Request wird geklont und mit "Authorization: Bearer <token>" erweitert.
 *   Wird in app.config.ts via withInterceptors([authInterceptor]) registriert.
 * @type {HttpInterceptorFn}
 * @param {HttpRequest} req - Ausgehender HTTP-Request.
 * @param {HttpHandlerFn} next - Nächster Handler in der Interceptor-Chain.
 * @returns {Observable<HttpEvent>} Weitergereichte HTTP-Response.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store: Store = inject(Store);

  return store.select(selectToken).pipe(
    take(1),
    switchMap((token: string | null) => {
      if (!token) return next(req);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};

/**
 * @fileoverview Auth HTTP Interceptor — JWT automatisch an Requests anhängen
 * @description Funktionaler HttpInterceptor der den JWT-Token aus dem NgRx Store liest
 *   und ihn als Authorization-Header an jeden ausgehenden HTTP-Request hängt.
 *   Fallback auf localStorage — beim App-Start ist der Store leer, der Token liegt
 *   aber noch in localStorage (Schlüssel 'ws2k_token'). So gelingt GET /api/auth/me
 *   beim Session Restore auch direkt nach einem Seiten-Refresh.
 *   Requests ohne Token werden unverändert weitergeleitet.
 * @module AuthInterceptor
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take } from 'rxjs';
import { selectToken } from '../../store/auth/auth.selectors';

/** localStorage-Schlüssel — muss mit loginSuccessEffect übereinstimmen. */
const TOKEN_KEY = 'ws2k_token';

/**
 * Hängt den JWT-Bearer-Token an jeden ausgehenden HTTP-Request.
 * @description Liest den Token einmalig aus dem NgRx Store (take(1)).
 *   Ist der Store-Token null (z.B. direkt nach einem Seiten-Refresh), wird als
 *   Fallback localStorage['ws2k_token'] verwendet — so kann restoreSessionEffect
 *   GET /api/auth/me mit gültigem Token aufrufen bevor der Store befüllt ist.
 *   Kein Token in Store und localStorage → Request unverändert weiterleiten.
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
      const resolvedToken = token ?? localStorage.getItem(TOKEN_KEY);
      if (!resolvedToken) return next(req);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${resolvedToken}` } }));
    }),
  );
};

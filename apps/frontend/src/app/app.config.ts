/**
 * @fileoverview Angular Application Configuration — Provider-Setup
 * @description Zentrale Konfiguration für die Angular-Applikation.
 *   Registriert: Router, HttpClient mit Auth-Interceptor, NgRx Store + Effects + DevTools.
 *   Wird in main.ts an bootstrapApplication() übergeben.
 * @module AppConfig
 */

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import * as AuthEffects from './store/auth/auth.effects';
import { authReducer } from './store/auth/auth.reducer';
import * as DestinationsEffects from './store/destinations/destinations.effects';
import { destinationsReducer } from './store/destinations/destinations.reducer';
import * as DockerEffects from './store/docker/docker.effects';
import { dockerReducer } from './store/docker/docker.reducer';
import * as UsersEffects from './store/users/users.effects';
import { usersReducer } from './store/users/users.reducer';

/**
 * Globale Angular ApplicationConfig.
 * @description Alle Provider auf App-Ebene:
 *   - Router mit Input Binding und View Transitions
 *   - HttpClient mit authInterceptor (hängt JWT automatisch an)
 *   - NgRx Store mit auth- und docker-Reducer
 *   - NgRx Effects für asynchrone Auth- und Docker-Logik
 *   - NgRx DevTools nur im Development-Mode
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      auth: authReducer,
      docker: dockerReducer,
      users: usersReducer,
      destinations: destinationsReducer,
    }),
    provideEffects(AuthEffects, DockerEffects, UsersEffects, DestinationsEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};

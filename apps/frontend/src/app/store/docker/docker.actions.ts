/**
 * @fileoverview Docker Actions — NgRx Action-Definitionen für Container-Management
 * @description Alle Actions des Docker-Stores.
 *   Gruppiert mit createActionGroup — Zugriff via DockerActions.loadContainers etc.
 *   Deckt: Container-Liste laden, Container starten, Container stoppen.
 * @module DockerActions
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DockerService } from '@workspace2k/shared';

/**
 * Docker Action Group — alle Container-Management-Actions.
 * @description Actions und ihre Props:
 *   - loadContainers: keine Props → Effect ruft GET /api/docker/containers ab
 *   - loadContainersSuccess: containers[] → Reducer setzt Container-Liste
 *   - loadContainersFailure: error → Reducer setzt Fehlermeldung
 *   - startContainer: id → Effect sendet POST /api/docker/containers/:id/start
 *   - startContainerSuccess: id → Reducer setzt Container-Status auf 'running'
 *   - startContainerFailure: id + error → Reducer entfernt id aus pendingIds
 *   - stopContainer: id → Effect sendet POST /api/docker/containers/:id/stop
 *   - stopContainerSuccess: id → Reducer setzt Container-Status auf 'stopped'
 *   - stopContainerFailure: id + error → Reducer entfernt id aus pendingIds
 */
export const DockerActions = createActionGroup({
  source: 'Docker',
  events: {
    'Load Containers': emptyProps(),
    'Load Containers Success': props<{ containers: DockerService[] }>(),
    'Load Containers Failure': props<{ error: string }>(),

    'Start Container': props<{ id: string }>(),
    'Start Container Success': props<{ id: string }>(),
    'Start Container Failure': props<{ id: string; error: string }>(),

    'Stop Container': props<{ id: string }>(),
    'Stop Container Success': props<{ id: string }>(),
    'Stop Container Failure': props<{ id: string; error: string }>(),
  },
});

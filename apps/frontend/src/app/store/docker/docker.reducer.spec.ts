/**
 * @fileoverview Docker Reducer Tests
 * @description Prüft alle State-Übergänge: loadContainers, loadContainerStats,
 *   startContainer, stopContainer, removeContainer, loadContainerLogs —
 *   jeweils Request/Success/Failure.
 */

import { DockerActions } from './docker.actions';
import { dockerReducer } from './docker.reducer';
import {
  ContainerStats,
  DockerService,
  DockerStack,
  DockerState,
  initialDockerState,
} from './docker.state';

const mockContainer: DockerService = {
  id: 'c1',
  name: 'nginx',
  status: 'running',
  image: 'nginx:latest',
};

const mockStopped: DockerService = {
  id: 'c2',
  name: 'postgres',
  status: 'stopped',
  image: 'postgres:17',
};

const mockStats: ContainerStats = {
  id: 'c1',
  name: 'nginx',
  cpuPercent: '2.5',
  memoryUsage: '128 MB',
  memoryLimit: '2 GB',
  memoryPercent: '6.25',
  uptime: '2h 15m',
};

const withContainers: DockerState = {
  ...initialDockerState,
  containers: [mockContainer, mockStopped],
};

describe('dockerReducer', () => {
  it('should return initial state for unknown action', () => {
    const state = dockerReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialDockerState);
  });

  // ── loadContainers ─────────────────────────────────────────────────────────

  describe('loadContainers', () => {
    it('should set isLoading to true', () => {
      const state = dockerReducer(initialDockerState, DockerActions.loadContainers());
      expect(state.isLoading).toBe(true);
    });

    it('should clear error', () => {
      const withError = { ...initialDockerState, error: 'old error' };
      const state = dockerReducer(withError, DockerActions.loadContainers());
      expect(state.error).toBeNull();
    });
  });

  describe('loadContainersSuccess', () => {
    it('should set containers list', () => {
      const state = dockerReducer(
        { ...initialDockerState, isLoading: true },
        DockerActions.loadContainersSuccess({ containers: [mockContainer, mockStopped] }),
      );
      expect(state.containers).toEqual([mockContainer, mockStopped]);
    });

    it('should set isLoading to false', () => {
      const state = dockerReducer(
        { ...initialDockerState, isLoading: true },
        DockerActions.loadContainersSuccess({ containers: [] }),
      );
      expect(state.isLoading).toBe(false);
    });
  });

  describe('loadContainersFailure', () => {
    it('should set error and clear isLoading', () => {
      const state = dockerReducer(
        { ...initialDockerState, isLoading: true },
        DockerActions.loadContainersFailure({ error: 'Docker Socket nicht erreichbar' }),
      );
      expect(state.error).toBe('Docker Socket nicht erreichbar');
      expect(state.isLoading).toBe(false);
    });
  });

  // ── loadContainerStats ─────────────────────────────────────────────────────

  describe('loadContainerStatsSuccess', () => {
    it('should add stats for container id', () => {
      const state = dockerReducer(
        withContainers,
        DockerActions.loadContainerStatsSuccess({ id: 'c1', stats: mockStats }),
      );
      expect(state.stats['c1']).toEqual(mockStats);
    });

    it('should not overwrite other container stats', () => {
      const withStats = { ...withContainers, stats: { c2: mockStats } };
      const state = dockerReducer(
        withStats,
        DockerActions.loadContainerStatsSuccess({ id: 'c1', stats: mockStats }),
      );
      expect(state.stats['c2']).toEqual(mockStats);
      expect(state.stats['c1']).toEqual(mockStats);
    });
  });

  // ── startContainer ─────────────────────────────────────────────────────────

  describe('startContainer', () => {
    it('should add id to pendingIds', () => {
      const state = dockerReducer(withContainers, DockerActions.startContainer({ id: 'c2' }));
      expect(state.pendingIds).toContain('c2');
    });
  });

  describe('startContainerSuccess', () => {
    it('should remove id from pendingIds', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(pending, DockerActions.startContainerSuccess({ id: 'c2' }));
      expect(state.pendingIds).not.toContain('c2');
    });

    it('should update container status to running', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(pending, DockerActions.startContainerSuccess({ id: 'c2' }));
      const container = state.containers.find((c) => c.id === 'c2');
      expect(container?.status).toBe('running');
    });
  });

  describe('startContainerFailure', () => {
    it('should remove id from pendingIds and set error', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(
        pending,
        DockerActions.startContainerFailure({ id: 'c2', error: 'Start fehlgeschlagen' }),
      );
      expect(state.pendingIds).not.toContain('c2');
      expect(state.error).toBe('Start fehlgeschlagen');
    });
  });

  // ── stopContainer ──────────────────────────────────────────────────────────

  describe('stopContainer', () => {
    it('should add id to pendingIds', () => {
      const state = dockerReducer(withContainers, DockerActions.stopContainer({ id: 'c1' }));
      expect(state.pendingIds).toContain('c1');
    });
  });

  describe('stopContainerSuccess', () => {
    it('should remove id from pendingIds', () => {
      const pending = { ...withContainers, pendingIds: ['c1'] };
      const state = dockerReducer(pending, DockerActions.stopContainerSuccess({ id: 'c1' }));
      expect(state.pendingIds).not.toContain('c1');
    });

    it('should update container status to stopped', () => {
      const pending = { ...withContainers, pendingIds: ['c1'] };
      const state = dockerReducer(pending, DockerActions.stopContainerSuccess({ id: 'c1' }));
      const container = state.containers.find((c) => c.id === 'c1');
      expect(container?.status).toBe('stopped');
    });
  });

  describe('stopContainerFailure', () => {
    it('should remove id from pendingIds and set error', () => {
      const pending = { ...withContainers, pendingIds: ['c1'] };
      const state = dockerReducer(
        pending,
        DockerActions.stopContainerFailure({ id: 'c1', error: 'Stop fehlgeschlagen' }),
      );
      expect(state.pendingIds).not.toContain('c1');
      expect(state.error).toBe('Stop fehlgeschlagen');
    });
  });

  // ── removeContainer ────────────────────────────────────────────────────────

  describe('removeContainer', () => {
    it('should add id to pendingIds', () => {
      const state = dockerReducer(withContainers, DockerActions.removeContainer({ id: 'c2' }));
      expect(state.pendingIds).toContain('c2');
    });

    it('should clear error on request', () => {
      const withError = { ...withContainers, error: 'alt' };
      const state = dockerReducer(withError, DockerActions.removeContainer({ id: 'c2' }));
      expect(state.error).toBeNull();
    });
  });

  describe('removeContainerSuccess', () => {
    it('should remove id from pendingIds', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(pending, DockerActions.removeContainerSuccess({ id: 'c2' }));
      expect(state.pendingIds).not.toContain('c2');
    });

    it('should remove container from list', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(pending, DockerActions.removeContainerSuccess({ id: 'c2' }));
      expect(state.containers.find((c) => c.id === 'c2')).toBeUndefined();
    });

    it('should keep other containers', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(pending, DockerActions.removeContainerSuccess({ id: 'c2' }));
      expect(state.containers.find((c) => c.id === 'c1')).toEqual(mockContainer);
    });
  });

  describe('removeContainerFailure', () => {
    it('should remove id from pendingIds and set error', () => {
      const pending = { ...withContainers, pendingIds: ['c2'] };
      const state = dockerReducer(
        pending,
        DockerActions.removeContainerFailure({ id: 'c2', error: 'Läuft noch' }),
      );
      expect(state.pendingIds).not.toContain('c2');
      expect(state.error).toBe('Läuft noch');
    });
  });

  // ── loadContainerLogs ──────────────────────────────────────────────────────

  describe('loadContainerLogs', () => {
    it('should add id to logsPendingIds', () => {
      const state = dockerReducer(withContainers, DockerActions.loadContainerLogs({ id: 'c1' }));
      expect(state.logsPendingIds).toContain('c1');
    });
  });

  describe('loadContainerLogsSuccess', () => {
    it('should remove id from logsPendingIds', () => {
      const loading = { ...withContainers, logsPendingIds: ['c1'] };
      const state = dockerReducer(
        loading,
        DockerActions.loadContainerLogsSuccess({ id: 'c1', lines: ['line 1', 'line 2'] }),
      );
      expect(state.logsPendingIds).not.toContain('c1');
    });

    it('should store log lines under container id', () => {
      const loading = { ...withContainers, logsPendingIds: ['c1'] };
      const state = dockerReducer(
        loading,
        DockerActions.loadContainerLogsSuccess({ id: 'c1', lines: ['line 1', 'line 2'] }),
      );
      expect(state.logs['c1']).toEqual(['line 1', 'line 2']);
    });

    it('should not overwrite logs of other containers', () => {
      const withLogs = { ...withContainers, logs: { c2: ['existing'] }, logsPendingIds: ['c1'] };
      const state = dockerReducer(
        withLogs,
        DockerActions.loadContainerLogsSuccess({ id: 'c1', lines: ['new'] }),
      );
      expect(state.logs['c2']).toEqual(['existing']);
    });
  });

  describe('loadContainerLogsFailure', () => {
    it('should remove id from logsPendingIds and set error', () => {
      const loading = { ...withContainers, logsPendingIds: ['c1'] };
      const state = dockerReducer(
        loading,
        DockerActions.loadContainerLogsFailure({ id: 'c1', error: 'Logs nicht abrufbar' }),
      );
      expect(state.logsPendingIds).not.toContain('c1');
      expect(state.error).toBe('Logs nicht abrufbar');
    });
  });

  // ── loadStacks ─────────────────────────────────────────────────────────────

  const mockStack: DockerStack = {
    name: 'vaultwarden',
    containers: [mockContainer, mockStopped],
    status: 'unknown',
  };

  describe('loadStacks', () => {
    it('should set stacksLoading to true', () => {
      const state = dockerReducer(initialDockerState, DockerActions.loadStacks());
      expect(state.stacksLoading).toBe(true);
    });
  });

  describe('loadStacksSuccess', () => {
    it('should set stacks and clear stacksLoading', () => {
      const state = dockerReducer(
        { ...initialDockerState, stacksLoading: true },
        DockerActions.loadStacksSuccess({ stacks: [mockStack] }),
      );
      expect(state.stacks).toEqual([mockStack]);
      expect(state.stacksLoading).toBe(false);
    });
  });

  describe('loadStacksFailure', () => {
    it('should clear stacksLoading and set error', () => {
      const state = dockerReducer(
        { ...initialDockerState, stacksLoading: true },
        DockerActions.loadStacksFailure({ error: 'Socket Fehler' }),
      );
      expect(state.stacksLoading).toBe(false);
      expect(state.error).toBe('Socket Fehler');
    });
  });

  // ── startStack ─────────────────────────────────────────────────────────────

  describe('startStack', () => {
    it('should add name to stackPendingNames', () => {
      const state = dockerReducer(
        { ...initialDockerState, stacks: [mockStack] },
        DockerActions.startStack({ name: 'vaultwarden' }),
      );
      expect(state.stackPendingNames).toContain('vaultwarden');
    });
  });

  describe('startStackSuccess', () => {
    it('should remove name from stackPendingNames', () => {
      const pending = {
        ...initialDockerState,
        stacks: [mockStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(
        pending,
        DockerActions.startStackSuccess({ name: 'vaultwarden' }),
      );
      expect(state.stackPendingNames).not.toContain('vaultwarden');
    });

    it('should add name to stackStartingNames (no optimistic status update)', () => {
      const pending = {
        ...initialDockerState,
        stacks: [mockStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(
        pending,
        DockerActions.startStackSuccess({ name: 'vaultwarden' }),
      );
      // Kein optimistisches 'running' — Polling zeigt echten Status.
      // stackStartingNames zeigt UI-Indikator bis Polling den Stack als running erkennt.
      expect(state.stackStartingNames).toContain('vaultwarden');
      expect(state.stackPendingNames).not.toContain('vaultwarden');
      const stack = state.stacks.find((s) => s.name === 'vaultwarden');
      expect(stack?.status).toBe('unknown'); // Polling, nicht optimistisch
    });
  });

  describe('startStackFailure', () => {
    it('should remove name from stackPendingNames and set error', () => {
      const pending = {
        ...initialDockerState,
        stacks: [mockStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(
        pending,
        DockerActions.startStackFailure({ name: 'vaultwarden', error: 'Start fehlgeschlagen' }),
      );
      expect(state.stackPendingNames).not.toContain('vaultwarden');
      expect(state.error).toBe('Start fehlgeschlagen');
    });
  });

  // ── stopStack ──────────────────────────────────────────────────────────────

  describe('stopStack', () => {
    it('should add name to stackPendingNames', () => {
      const runningStack: DockerStack = { ...mockStack, status: 'running' };
      const state = dockerReducer(
        { ...initialDockerState, stacks: [runningStack] },
        DockerActions.stopStack({ name: 'vaultwarden' }),
      );
      expect(state.stackPendingNames).toContain('vaultwarden');
    });
  });

  describe('stopStackSuccess', () => {
    it('should remove name from stackPendingNames', () => {
      const runningStack: DockerStack = { ...mockStack, status: 'running' };
      const pending = {
        ...initialDockerState,
        stacks: [runningStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(pending, DockerActions.stopStackSuccess({ name: 'vaultwarden' }));
      expect(state.stackPendingNames).not.toContain('vaultwarden');
    });

    it('should update stack and containers status to stopped', () => {
      const runningStack: DockerStack = { ...mockStack, status: 'running' };
      const pending = {
        ...initialDockerState,
        stacks: [runningStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(pending, DockerActions.stopStackSuccess({ name: 'vaultwarden' }));
      const stack = state.stacks.find((s) => s.name === 'vaultwarden');
      expect(stack?.status).toBe('stopped');
      stack?.containers.forEach((c) => expect(c.status).toBe('stopped'));
    });
  });

  describe('stopStackFailure', () => {
    it('should remove name from stackPendingNames and set error', () => {
      const pending = {
        ...initialDockerState,
        stacks: [mockStack],
        stackPendingNames: ['vaultwarden'],
      };
      const state = dockerReducer(
        pending,
        DockerActions.stopStackFailure({ name: 'vaultwarden', error: 'Stop fehlgeschlagen' }),
      );
      expect(state.stackPendingNames).not.toContain('vaultwarden');
      expect(state.error).toBe('Stop fehlgeschlagen');
    });
  });
});

/**
 * @fileoverview Docker Reducer Tests
 * @description Prüft alle State-Übergänge: loadContainers, loadContainerStats,
 *   startContainer, stopContainer — jeweils Request/Success/Failure.
 */

import { DockerActions } from './docker.actions';
import { dockerReducer } from './docker.reducer';
import { ContainerStats, DockerService, DockerState, initialDockerState } from './docker.state';

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
});

/**
 * @fileoverview Docker Selectors Tests
 * @description Prüft alle Selektoren: selectAllContainers, selectAllStats,
 *   selectDockerLoading, selectDockerError, selectPendingIds,
 *   selectRunningCount, selectStoppedCount, selectAllLogs, selectLogsPendingIds.
 */

import {
  selectAllContainers,
  selectAllLogs,
  selectAllStats,
  selectDockerError,
  selectDockerLoading,
  selectLogsPendingIds,
  selectPendingIds,
  selectRunningCount,
  selectStoppedCount,
} from './docker.selectors';
import { ContainerStats, DockerService, DockerState } from './docker.state';

const running: DockerService = {
  id: 'c1',
  name: 'nginx',
  status: 'running',
  image: 'nginx:latest',
};
const stopped: DockerService = { id: 'c2', name: 'pg', status: 'stopped', image: 'postgres:17' };
const running2: DockerService = { id: 'c3', name: 'redis', status: 'running', image: 'redis:7' };

const mockStats: ContainerStats = {
  id: 'c1',
  name: 'nginx',
  cpuPercent: '1',
  memoryUsage: '64 MB',
  memoryLimit: '1 GB',
  memoryPercent: '6.25',
  uptime: '5m',
};

const buildState = (partial: Partial<DockerState>): { docker: DockerState } => ({
  docker: {
    containers: [],
    stats: {},
    logs: {},
    isLoading: false,
    pendingIds: [],
    logsPendingIds: [],
    error: null,
    ...partial,
  },
});

describe('Docker Selectors', () => {
  describe('selectAllContainers', () => {
    it('should return empty array on initial state', () => {
      expect(selectAllContainers(buildState({}))).toEqual([]);
    });

    it('should return all containers', () => {
      expect(selectAllContainers(buildState({ containers: [running, stopped] }))).toEqual([
        running,
        stopped,
      ]);
    });
  });

  describe('selectAllStats', () => {
    it('should return empty record on initial state', () => {
      expect(selectAllStats(buildState({}))).toEqual({});
    });

    it('should return stats record', () => {
      const stats = { c1: mockStats };
      expect(selectAllStats(buildState({ stats }))).toEqual(stats);
    });
  });

  describe('selectDockerLoading', () => {
    it('should return false on initial state', () => {
      expect(selectDockerLoading(buildState({}))).toBe(false);
    });

    it('should return true when loading', () => {
      expect(selectDockerLoading(buildState({ isLoading: true }))).toBe(true);
    });
  });

  describe('selectDockerError', () => {
    it('should return null on initial state', () => {
      expect(selectDockerError(buildState({}))).toBeNull();
    });

    it('should return error message', () => {
      expect(selectDockerError(buildState({ error: 'Socket Fehler' }))).toBe('Socket Fehler');
    });
  });

  describe('selectPendingIds', () => {
    it('should return empty array on initial state', () => {
      expect(selectPendingIds(buildState({}))).toEqual([]);
    });

    it('should return pending ids', () => {
      expect(selectPendingIds(buildState({ pendingIds: ['c1'] }))).toEqual(['c1']);
    });
  });

  describe('selectRunningCount', () => {
    it('should return 0 with no containers', () => {
      expect(selectRunningCount(buildState({}))).toBe(0);
    });

    it('should count only running containers', () => {
      expect(selectRunningCount(buildState({ containers: [running, stopped, running2] }))).toBe(2);
    });
  });

  describe('selectStoppedCount', () => {
    it('should return 0 with no containers', () => {
      expect(selectStoppedCount(buildState({}))).toBe(0);
    });

    it('should count only stopped containers', () => {
      expect(selectStoppedCount(buildState({ containers: [running, stopped, running2] }))).toBe(1);
    });
  });

  // ── selectAllLogs ──────────────────────────────────────────────────────────

  describe('selectAllLogs', () => {
    it('should return empty record on initial state', () => {
      expect(selectAllLogs(buildState({}))).toEqual({});
    });

    it('should return logs record', () => {
      const logs = { c1: ['line 1', 'line 2'] };
      expect(selectAllLogs(buildState({ logs }))).toEqual(logs);
    });

    it('should return logs for multiple containers independently', () => {
      const logs = { c1: ['a'], c2: ['b', 'c'] };
      const result = selectAllLogs(buildState({ logs }));
      expect(result['c1']).toEqual(['a']);
      expect(result['c2']).toEqual(['b', 'c']);
    });
  });

  // ── selectLogsPendingIds ───────────────────────────────────────────────────

  describe('selectLogsPendingIds', () => {
    it('should return empty array on initial state', () => {
      expect(selectLogsPendingIds(buildState({}))).toEqual([]);
    });

    it('should return logsPendingIds', () => {
      expect(selectLogsPendingIds(buildState({ logsPendingIds: ['c1'] }))).toEqual(['c1']);
    });

    it('should return all pending log ids', () => {
      expect(selectLogsPendingIds(buildState({ logsPendingIds: ['c1', 'c3'] }))).toEqual([
        'c1',
        'c3',
      ]);
    });
  });
});

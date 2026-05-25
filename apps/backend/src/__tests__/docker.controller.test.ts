/**
 * @fileoverview Docker Controller Tests
 * @description Prüft alle HTTP-Handler: getContainers, getContainerStats,
 *   startContainer, stopContainer, removeContainer, getContainerLogs.
 *   docker.service wird gemockt — kein echter Docker-Socket.
 */

import { Request, Response } from 'express';
import {
  getContainers,
  getContainerStats,
  getContainerLogs,
  removeContainer,
  startContainer,
  stopContainer,
} from '../controllers/docker.controller';

jest.mock('../services/docker.service', () => ({
  listContainers: jest.fn(),
  getContainerStats: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  removeContainer: jest.fn(),
  getContainerLogs: jest.fn(),
}));

import * as dockerService from '../services/docker.service';

const mockDockerService = dockerService as jest.Mocked<typeof dockerService>;

function buildReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function buildRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

const mockContainer = {
  id: 'abc123',
  name: 'nginx',
  status: 'running' as const,
  image: 'nginx:latest',
  port: 80,
};

const mockStats = {
  id: 'abc123',
  name: 'nginx',
  cpuPercent: '1.5',
  memoryUsage: '64 MB',
  memoryLimit: '2 GB',
  memoryPercent: '3.1',
  uptime: '1h 30m',
};

describe('Docker Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getContainers ──────────────────────────────────────────────────────────

  describe('getContainers()', () => {
    it('should return container list wrapped in data', async () => {
      mockDockerService.listContainers.mockResolvedValue([mockContainer]);
      const req = buildReq();
      const res = buildRes();

      await getContainers(req, res as Response);

      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.data).toEqual([mockContainer]);
    });

    it('should return 503 when docker socket is unreachable', async () => {
      mockDockerService.listContainers.mockRejectedValue(new Error('ENOENT'));
      const req = buildReq();
      const res = buildRes();

      await getContainers(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ── getContainerStats ──────────────────────────────────────────────────────

  describe('getContainerStats()', () => {
    it('should return stats wrapped in data', async () => {
      mockDockerService.getContainerStats.mockResolvedValue(mockStats);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await getContainerStats(req, res as Response);

      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.data).toEqual(mockStats);
    });

    it('should return 404 when container not found', async () => {
      const err = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockDockerService.getContainerStats.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'ghost' } });
      const res = buildRes();

      await getContainerStats(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 503 on docker error', async () => {
      mockDockerService.getContainerStats.mockRejectedValue(new Error('socket hang up'));
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await getContainerStats(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ── startContainer ─────────────────────────────────────────────────────────

  describe('startContainer()', () => {
    it('should return 200 on success', async () => {
      mockDockerService.startContainer.mockResolvedValue(undefined);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await startContainer(req, res as Response);

      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 409 when container already running (304)', async () => {
      const err = Object.assign(new Error('Already running'), { statusCode: 304 });
      mockDockerService.startContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await startContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 404 when container not found', async () => {
      const err = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockDockerService.startContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'ghost' } });
      const res = buildRes();

      await startContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── stopContainer ──────────────────────────────────────────────────────────

  describe('stopContainer()', () => {
    it('should return 200 on success', async () => {
      mockDockerService.stopContainer.mockResolvedValue(undefined);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await stopContainer(req, res as Response);

      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 409 when container already stopped (304)', async () => {
      const err = Object.assign(new Error('Already stopped'), { statusCode: 304 });
      mockDockerService.stopContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await stopContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 404 when container not found', async () => {
      const err = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockDockerService.stopContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'ghost' } });
      const res = buildRes();

      await stopContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── removeContainer ────────────────────────────────────────────────────────

  describe('removeContainer()', () => {
    it('should return 204 on success', async () => {
      mockDockerService.removeContainer.mockResolvedValue(undefined);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await removeContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 409 when container is still running', async () => {
      const err = Object.assign(new Error('Container is running'), { statusCode: 409 });
      mockDockerService.removeContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await removeContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.message).toContain('stoppen');
    });

    it('should return 404 when container not found', async () => {
      const err = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockDockerService.removeContainer.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'ghost' } });
      const res = buildRes();

      await removeContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 503 on docker socket error', async () => {
      mockDockerService.removeContainer.mockRejectedValue(new Error('socket error'));
      const req = buildReq({ params: { id: 'abc123' } });
      const res = buildRes();

      await removeContainer(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ── getContainerLogs ───────────────────────────────────────────────────────

  describe('getContainerLogs()', () => {
    it('should return log lines wrapped in data', async () => {
      const lines = ['2026-05-25 INFO start', '2026-05-25 INFO ready'];
      mockDockerService.getContainerLogs.mockResolvedValue(lines);
      const req = buildReq({ params: { id: 'abc123' }, query: { tail: '50' } });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.data).toEqual(lines);
    });

    it('should use default tail=100 when not provided', async () => {
      mockDockerService.getContainerLogs.mockResolvedValue([]);
      const req = buildReq({ params: { id: 'abc123' }, query: {} });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      expect(mockDockerService.getContainerLogs).toHaveBeenCalledWith('abc123', 100);
    });

    it('should parse tail query param as number', async () => {
      mockDockerService.getContainerLogs.mockResolvedValue([]);
      const req = buildReq({ params: { id: 'abc123' }, query: { tail: '200' } });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      expect(mockDockerService.getContainerLogs).toHaveBeenCalledWith('abc123', 200);
    });

    it('should fall back to 100 when tail is not a number', async () => {
      mockDockerService.getContainerLogs.mockResolvedValue([]);
      const req = buildReq({ params: { id: 'abc123' }, query: { tail: 'abc' } });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      expect(mockDockerService.getContainerLogs).toHaveBeenCalledWith('abc123', 100);
    });

    it('should return 404 when container not found', async () => {
      const err = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockDockerService.getContainerLogs.mockRejectedValue(err);
      const req = buildReq({ params: { id: 'ghost' }, query: {} });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 503 on docker socket error', async () => {
      mockDockerService.getContainerLogs.mockRejectedValue(new Error('socket error'));
      const req = buildReq({ params: { id: 'abc123' }, query: {} });
      const res = buildRes();

      await getContainerLogs(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });
});

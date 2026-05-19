export type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown';

export interface DockerService {
  id: string;
  name: string;
  image: string;
  status: ServiceStatus;
  url?: string;
  port?: number;
  memoryUsage?: string;
  cpuPercent?: string;
}

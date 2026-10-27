import { AppConfig } from '../core/config/app-config';
import { Task } from '../core/models/task';

export const TEST_CONFIG: AppConfig = {
  storageKey: 'test',
  seedUrl: 'seed.json',
  features: { statistics: true, dragAndDrop: true },
};

export function aTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Buy coffee',
    done: false,
    priority: 'high',
    tags: [],
    projectId: 'p1',
    order: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

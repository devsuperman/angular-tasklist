export type Priority = 'low' | 'medium' | 'high';

export const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'];

export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string; // ISO date, for example '2026-11-03'
  tags: string[];
  projectId: string;
  order: number; // for drag and drop
  createdAt: string;
}

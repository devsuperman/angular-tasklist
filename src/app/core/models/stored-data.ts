import { Project } from './project';
import { Task } from './task';

/** What `public/seed.json` contains. */
export interface SeedData {
  tasks: Task[];
  projects: Project[];
}

/** What is saved in localStorage, under one key. */
export interface StoredData extends SeedData {
  version: number; // schema version, bumped when the shape changes
}

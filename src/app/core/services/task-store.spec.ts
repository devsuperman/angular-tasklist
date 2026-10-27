import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TEST_CONFIG, aTask } from '../../testing/test-data';
import { APP_CONFIG } from '../config/app-config';
import { DataRepository } from './data-repository';
import { MemoryStorageService, StorageService } from './storage.service';
import { TaskStore } from './task-store';

describe('TaskStore', () => {
  function setup(saved?: object) {
    const storage = new MemoryStorageService();
    if (saved) storage.setItem(TEST_CONFIG.storageKey, JSON.stringify(saved));
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storage }, // never touch real localStorage
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        provideHttpClient(),
        provideHttpClientTesting(), // no real HTTP
      ],
    });
    return {
      store: TestBed.inject(TaskStore),
      http: TestBed.inject(HttpTestingController),
    };
  }

  describe('with saved data', () => {
    const saved = {
      version: 1,
      projects: [{ id: 'p1', name: 'One', color: '#000' }],
      tasks: [aTask({ id: 'b', order: 1 }), aTask({ id: 'a', order: 0 })],
    };

    it('starts from the saved tasks, sorted by order, without requesting the seed', () => {
      const { store, http } = setup(saved);
      expect(store.tasks().map((t) => t.id)).toEqual(['a', 'b']);
      TestBed.tick();
      http.verify(); // seed.json was never requested
    });
  });

  describe('changing tasks', () => {
    let store: TaskStore;

    beforeEach(() => {
      store = setup({ version: 1, tasks: [], projects: [] }).store;
    });

    it('adds a task as not done, at the end', () => {
      store.add({ title: 'First', priority: 'low', projectId: 'p1' });
      const task = store.add({ title: 'Write tests', priority: 'high', projectId: 'p1' });
      expect(store.tasks()).toHaveLength(2);
      expect(task).toMatchObject({ done: false, tags: [], order: 1 });
      expect(store.byId(task.id)).toBe(task);
    });

    it('toggles a task and updates the counters', () => {
      const task = store.add({ title: 'A', priority: 'low', projectId: 'p1' });
      store.add({ title: 'B', priority: 'low', projectId: 'p1' });
      store.toggle(task.id);
      expect(store.doneCount()).toBe(1);
      expect(store.pendingCount()).toBe(1);
      expect(store.total()).toBe(2);
    });

    it('counts overdue tasks that are not done', () => {
      const late = store.add({
        title: 'Late',
        priority: 'low',
        projectId: 'p1',
        dueDate: '2000-01-01',
      });
      store.add({ title: 'Later', priority: 'low', projectId: 'p1', dueDate: '2999-01-01' });
      expect(store.overdueCount()).toBe(1);
      store.toggle(late.id);
      expect(store.overdueCount()).toBe(0);
    });

    it('updates and removes tasks without mutating the old array', () => {
      const task = store.add({ title: 'A', priority: 'low', projectId: 'p1' });
      const before = store.tasks();
      store.update(task.id, { title: 'B' });
      expect(store.byId(task.id)?.title).toBe('B');
      expect(before[0].title).toBe('A');
      store.remove(task.id);
      expect(store.tasks()).toEqual([]);
    });

    it('removes the tasks of a project', () => {
      store.add({ title: 'A', priority: 'low', projectId: 'p1' });
      store.add({ title: 'B', priority: 'low', projectId: 'p2' });
      store.removeByProject('p1');
      expect(store.tasks().map((t) => t.title)).toEqual(['B']);
    });

    it('reorders some tasks and leaves the others in their slots', () => {
      const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((title) =>
        store.add({ title, priority: 'low', projectId: 'p1' }),
      );
      // Only A, C and D are visible (B is filtered out); move D to the top
      store.reorder([d.id, a.id, c.id]);
      expect(store.tasks().map((t) => t.title)).toEqual(['D', 'B', 'A', 'C']);
      expect(store.tasks().map((t) => t.order)).toEqual([0, 1, 2, 3]);
      expect(store.byId(b.id)?.order).toBe(1);
    });
  });

  it('loads the seed when nothing is saved', async () => {
    const { store, http } = setup();
    const seedTask = aTask();

    TestBed.tick(); // let the resource send its request
    expect(store.isLoading()).toBe(true);
    http.expectOne('seed.json').flush({ tasks: [seedTask], projects: [] });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.isLoading()).toBe(false);
    expect(store.tasks()).toEqual([seedTask]);
    http.verify(); // no unexpected requests left
  });

  it('exposes the error when the seed cannot be loaded', async () => {
    const { store, http } = setup();
    TestBed.tick();
    http.expectOne('seed.json').flush('nope', { status: 404, statusText: 'Not Found' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.loadError()).toBeTruthy();
    expect(store.tasks()).toEqual([]);
  });

  it('rejects a seed with the wrong shape', async () => {
    const { store, http } = setup();
    TestBed.tick();
    http.expectOne('seed.json').flush({ tasks: [{ title: 'no id' }], projects: [] });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.loadError()).toBeTruthy();
    expect(TestBed.inject(DataRepository).load()).toBeNull();
  });
});

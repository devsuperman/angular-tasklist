import { TestBed } from '@angular/core/testing';
import { TEST_CONFIG, aTask } from '../../testing/test-data';
import { APP_CONFIG } from '../config/app-config';
import { CURRENT_VERSION, DataRepository, StorageFullError } from './data-repository';
import { MemoryStorageService, StorageService } from './storage.service';

describe('DataRepository', () => {
  let storage: MemoryStorageService;
  let repository: DataRepository;
  const project = { id: 'p1', name: 'One', color: '#000000' };

  beforeEach(() => {
    storage = new MemoryStorageService();
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storage },
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
      ],
    });
    repository = TestBed.inject(DataRepository);
  });

  it('returns null when nothing is saved', () => {
    expect(repository.load()).toBeNull();
  });

  it('saves with the current version and loads it back', () => {
    repository.save({ tasks: [aTask()], projects: [project] });
    expect(JSON.parse(storage.getItem('test')!).version).toBe(CURRENT_VERSION);
    expect(repository.load()).toEqual({
      version: CURRENT_VERSION,
      tasks: [aTask()],
      projects: [project],
    });
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['no version', JSON.stringify({ tasks: [], projects: [] })],
    ['tasks is not an array', JSON.stringify({ version: 1, tasks: {}, projects: [] })],
    ['a broken task', JSON.stringify({ version: 1, tasks: [{ id: 1 }], projects: [] })],
    [
      'an unknown priority',
      JSON.stringify({ version: 1, tasks: [aTask({ priority: 'urgent' as never })], projects: [] }),
    ],
  ])('returns null for %s', (_, raw) => {
    storage.setItem('test', raw);
    expect(repository.load()).toBeNull();
  });

  it('turns a full storage into a StorageFullError', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => repository.save({ tasks: [], projects: [] })).toThrow(StorageFullError);
  });

  it('knows its own key, and treats a cleared storage (null key) as its own', () => {
    expect(repository.isOwnKey('test')).toBe(true);
    expect(repository.isOwnKey(null)).toBe(true);
    expect(repository.isOwnKey('angular-tasklist-theme')).toBe(false);
  });
});

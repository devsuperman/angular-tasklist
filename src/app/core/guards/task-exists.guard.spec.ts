import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { aTask } from '../../testing/test-data';
import { TaskStore } from '../services/task-store';
import { taskExistsGuard } from './task-exists.guard';

describe('taskExistsGuard', () => {
  const known = aTask({ id: 'known' });

  function run(id: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // A fake store: the guard only needs byId()
        {
          provide: TaskStore,
          useValue: { byId: (x: string) => (x === known.id ? known : undefined) },
        },
      ],
    });
    const route = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => taskExistsGuard(route, {} as RouterStateSnapshot));
  }

  it('lets a known id through', () => {
    expect(run('known')).toBe(true);
  });

  it('redirects to /tasks for an unknown id', () => {
    const result = run('nope');
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/tasks');
  });
});

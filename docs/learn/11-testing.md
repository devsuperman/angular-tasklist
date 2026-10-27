# Chapter 11 — Testing

**Phase 9** · Concepts: Vitest, `TestBed`, `ComponentFixture`, `whenStable`, testing signals, stores, pipes, guards and interceptors, `provideHttpClientTesting` / `HttpTestingController`, component harnesses, Playwright end-to-end tests.

---

## 11.1 Why test, and what

Tests let you change code without fear. The architecture from Chapter 5 was chosen partly **to make testing easy**: the logic is in stores, repositories, pipes and validators, which are plain classes and functions.

| Level      | What                                                 | Tool                        | Speed   | How many |
| ---------- | ---------------------------------------------------- | --------------------------- | ------- | -------- |
| Unit       | One function or class: store, pipe, validator, guard | Vitest (+ `TestBed` for DI) | ms      | Many     |
| Component  | A component's template, inputs and outputs           | Vitest + `TestBed`          | ms      | Some     |
| End-to-end | The real app in a real browser                       | Playwright                  | seconds | Few      |

---

## 11.2 The test setup in this project

🟢 **In the code today**:

- `angular.json` → `test` target → `@angular/build:unit-test`. It builds the specs with the same compiler as the app and runs them with **Vitest**. The DOM is simulated with **jsdom** (in `devDependencies`).
- `tsconfig.spec.json` adds `vitest/globals`, so `describe`, `it`, `expect`, `beforeEach` and `vi` need no import.
- `npm test` runs in watch mode; CI runs `npm test -- --watch=false` (see `.github/workflows/deploy.yml`).

🟢 **The existing test**, `src/app/app.spec.ts`:

```ts
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Tasklist');
  });
});
```

What each piece does:

- **`TestBed`** is a small Angular environment for tests: an injector plus a compiler. `configureTestingModule` gives it what the test needs: `imports` (the standalone component) and `providers` (real or fake services).
- **`TestBed.createComponent(App)`** creates the component and returns a **fixture**: `componentInstance` (the class) and `nativeElement` (the DOM).
- **`await fixture.whenStable()`** waits until Angular has rendered and all pending work is done. In a zoneless app this is how you let the template update after you change something. (`fixture.detectChanges()` also works and is synchronous.)
- The test checks the **DOM**, not the signal. That is the point: the user sees the `<h1>`, not `title()`.

---

## 11.3 Unit testing a store

🟢 **Built (Phase 9)**: `core/services/task-store.spec.ts`

```ts
describe('TaskStore', () => {
  let store: TaskStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useClass: MemoryStorageService }, // never touch real localStorage
        {
          provide: APP_CONFIG,
          useValue: { storageKey: 'test', seedUrl: 'seed.json', features: {} },
        },
        provideHttpClient(),
        provideHttpClientTesting(), // no real HTTP
      ],
    });
    store = TestBed.inject(TaskStore);
  });

  it('adds a task as not done', () => {
    store.add({ title: 'Write tests', priority: 'high', projectId: 'p1' });
    expect(store.tasks()).toHaveLength(1);
    expect(store.tasks()[0].done).toBe(false);
  });

  it('toggles a task and updates the counters', () => {
    const task = store.add({ title: 'A', priority: 'low', projectId: 'p1' });
    store.toggle(task.id);
    expect(store.doneCount()).toBe(1);
    expect(store.pendingCount()).toBe(0);
  });
});
```

- **Signals are easy to test**: call a method, read the signal. `computed` values are up to date the moment you read them.
- **`TestBed.inject(Token)`** is `inject()` for tests.
- **`MemoryStorageService`** is why `StorageService` is an abstract class (Chapter 5): the test swaps the implementation, and nothing else changes.
- **Effects** run during change detection. If the store saves in an effect (Chapter 8, option B), call `TestBed.tick()` before checking the storage.

---

## 11.4 Testing pure functions: pipes and validators

No `TestBed` needed: they are plain classes and functions.

```ts
describe('RelativeDatePipe', () => {
  const pipe = new RelativeDatePipe();

  it.each([
    ['2026-10-28', 'tomorrow'],
    ['2026-10-26', 'yesterday'],
    ['2026-10-30', 'in 3 days'],
  ])('%s → %s', (date, expected) => {
    expect(pipe.transform(date, '2026-10-27')).toBe(expected);
  });

  it('returns an empty string without a date', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});

describe('notInThePast', () => {
  it('rejects yesterday', () => {
    vi.useFakeTimers({ now: new Date('2026-10-27T12:00:00Z') });
    expect(notInThePast(new FormControl('2026-10-26'))).toEqual({ pastDate: true });
    vi.useRealTimers();
  });
});
```

Passing `today` to the pipe (Chapter 9) made the test simple. For code that reads the clock itself, `vi.useFakeTimers({ now })` fixes the date.

---

## 11.5 Testing a guard

```ts
describe('taskExistsGuard', () => {
  it('redirects to /tasks for an unknown id', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TaskStore, useValue: { byId: () => undefined } }],
    });

    const route = { paramMap: convertToParamMap({ id: 'nope' }) } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      taskExistsGuard(route, {} as RouterStateSnapshot),
    );

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/tasks');
  });
});
```

- **`TestBed.runInInjectionContext`** lets a functional guard call `inject()`.
- **`useValue` with a tiny fake** (`{ byId: () => undefined }`) replaces the real store. Fake only what the code under test calls.

For more realistic routing tests, `RouterTestingHarness` navigates to a URL and gives you the rendered page.

---

## 11.6 Testing a component: inputs and outputs

🟢 **Built (Phase 9)**: `TaskItemComponent`

```ts
describe('TaskItemComponent', () => {
  const task: Task = {
    id: '1',
    title: 'Buy coffee',
    done: false,
    priority: 'high',
    tags: [],
    projectId: 'p',
    order: 0,
    createdAt: '',
  };

  it('shows the title and emits toggleDone on change', async () => {
    const fixture = TestBed.createComponent(TaskItemComponent);
    fixture.componentRef.setInput('task', task); // set a signal input
    await fixture.whenStable();

    const toggled = vi.fn();
    fixture.componentInstance.toggleDone.subscribe(toggled); // listen to an output

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Buy coffee');

    el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    expect(toggled).toHaveBeenCalledWith('1');
  });

  it('marks done tasks', async () => {
    const fixture = TestBed.createComponent(TaskItemComponent);
    fixture.componentRef.setInput('task', { ...task, done: true });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.task').classList).toContain('done');
  });
});
```

- **`componentRef.setInput(name, value)`** is how a test sets a signal input (you cannot `set` an input from outside).
- Interact with the **DOM** (`click()`) like a user would, not by calling protected methods.
- Prefer finding elements by what the user sees (labels, roles, text) over CSS classes when you can: tests then survive refactors.

### Component harnesses

When you use CDK or Material components, their **harnesses** give a stable testing API: `await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))`. They hide internal DOM details that can change between versions. You can write harnesses for your own components too.

---

## 11.7 Testing HTTP: `HttpTestingController`

🟢 **Built (Phase 9)**: the seed loading test.

```ts
it('loads the seed when nothing is saved', async () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: StorageService, useClass: MemoryStorageService },
      { provide: APP_CONFIG, useValue: testConfig },
    ],
  });
  const store = TestBed.inject(TaskStore);
  const http = TestBed.inject(HttpTestingController);

  TestBed.tick(); // let the resource send its request
  http.expectOne('seed.json').flush({ tasks: [aTask], projects: [] });
  await TestBed.inject(ApplicationRef).whenStable();

  expect(store.tasks()).toEqual([aTask]);
  http.verify(); // no unexpected requests left
});
```

- **`provideHttpClientTesting()`** replaces the real backend; requests wait until you answer them.
- **`expectOne(url)`** asserts that exactly one request was made, and returns it.
- **`flush(body)`** answers it; `flush(null, { status: 404, statusText: 'Not Found' })` tests the error path (and your interceptor).
- **`verify()`** fails if any request was not handled.

---

## 11.8 End-to-end tests with Playwright

### What

Playwright opens a real browser, loads the built app, and acts like a user.

🟢 **Built (Phase 9)**: the flow from [TASKS.md](../TASKS.md):

```ts
// e2e/tasks.spec.ts
import { expect, test } from '@playwright/test';

test('create, complete, persist and delete a task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'New task' }).click();
  await page.getByLabel('Title').fill('Learn Playwright');
  await page.getByRole('button', { name: 'Create' }).click();

  const row = page.getByRole('listitem').filter({ hasText: 'Learn Playwright' });
  await row.getByRole('checkbox').check();

  await page.reload();
  await expect(row.getByRole('checkbox')).toBeChecked();

  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: 'Delete' }).click(); // the confirmation dialog
  await expect(row).toHaveCount(0);
});
```

### Why

Unit tests prove the pieces work; one e2e test proves they work **together**: routing, forms, storage and the reload. `getByRole` / `getByLabel` find elements the way assistive technology does, so good accessibility (Chapter 10) makes e2e tests easier to write. That is not a coincidence.

---

## Pitfalls

- **Testing implementation details** (private signals, protected methods): tests break on every refactor. Test public APIs and the DOM.
- **Real `localStorage` in tests**: tests affect each other. Use `MemoryStorageService`.
- **Forgetting to wait** (`whenStable`, `TestBed.tick()`): the DOM is not updated yet.
- **Forgetting `http.verify()`**: unexpected requests go unnoticed.
- **Too many e2e tests**: slow and flaky. Keep a few for the main flows.

## Try it yourself

1. Run `npm test` and read both tests in `app.spec.ts`. Change the title and watch one fail.
2. Write the `TaskStore` tests with `MemoryStorageService`.
3. Test `relativeDate` with `it.each`.
4. Test `taskExistsGuard` with `runInInjectionContext`.
5. Test `TaskItemComponent` with `setInput` and a clicked checkbox.
6. Test the seed loading and the error interceptor with `HttpTestingController`.
7. Add Playwright and write the e2e flow.

## In this repo

- Unit and component tests sit next to the code (`*.spec.ts`), with shared helpers in `src/app/testing/test-data.ts`. Run them with `npm test`.
- `TaskItemComponent`'s test selects the delete button by class: interpolated `aria-*` attributes are set as ARIA properties, which jsdom does not reflect to attributes.
- E2E: `e2e/tasks.spec.ts` and `e2e/production.spec.ts` (Portuguese, offline), run with `npm run e2e`. `playwright.config.ts` builds with `build:pages` and serves the result like GitHub Pages (`e2e/serve-pages.mjs`).

## Further reading

- [Testing overview](https://angular.dev/guide/testing)
- [Component testing basics](https://angular.dev/guide/testing/components-basics)
- [Testing services](https://angular.dev/guide/testing/services)
- [Testing HTTP](https://angular.dev/guide/http/testing)
- [Component harnesses](https://angular.dev/guide/testing/using-component-harnesses)
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev)

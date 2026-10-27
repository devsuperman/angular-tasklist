# Tech Stack Plan — Angular Tasklist

The technical decisions, architecture and conventions for the project. For what the product does, see [BUSINESS_PLAN.md](BUSINESS_PLAN.md). For the work broken into steps, see [TASKS.md](TASKS.md).

## Stack

| Concern          | Choice                                                                                        | Why                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework        | Latest stable Angular, standalone components (no NgModules)                                   | The current recommended way to write Angular                                                   |
| Reactivity       | Signals (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) + RxJS for event streams | Signals are Angular's main reactivity model; RxJS is still used for async streams              |
| Change detection | Zoneless (the default in new projects since Angular 21)                                       | Matches modern Angular and forces a clear understanding of signals                             |
| Language         | TypeScript in strict mode                                                                     | Catches errors early, and typed forms need it                                                  |
| Styling          | SCSS; Angular Material + CDK later (phase 8)                                                  | SCSS is simple to start with; the CDK gives drag and drop, overlays and a11y                   |
| Persistence      | `localStorage` behind a `StorageService`; seed data in `public/seed.json`                     | No server needed, so the app is plain static files that GitHub Pages can host                  |
| Unit tests       | Vitest (the Angular CLI default) + Angular testing utilities                                  | Fast, and the default for new projects                                                         |
| E2E tests        | Playwright                                                                                    | Reliable cross-browser tests                                                                   |
| Code quality     | ESLint (`@angular-eslint`), Prettier                                                          | Consistent style and catches mistakes                                                          |
| CI/CD            | GitHub Actions; deploy to GitHub Pages                                                        | Free, integrated with the repo, and enough for a static app                                    |
| i18n and PWA     | `@angular/localize` (runtime translations), `@angular/service-worker`                         | English and pt-BR in one build, and offline support (no SSR: GitHub Pages cannot run a server) |

## Architecture

### Layers

- **Components** show data and send user events. They hold no business logic.
- **Stores** (services that keep state in signals) own the app state and the business rules.
- **Repository** (`DataRepository`) reads and writes typed, versioned data through `StorageService`. It is the only code that knows how data is stored. (One repository instead of one per entity, because all data shares one key.)
- **`StorageService`** is an abstract class with a `LocalStorageService` implementation, so tests can use an in-memory fake.
- **`HttpClient`** is used only to load `public/seed.json` on the first visit. An interceptor handles errors and the loading indicator for that request.

```
Component  ──calls──▶  Store (signals)  ──calls──▶  Repository  ──▶  StorageService  ──▶  localStorage
    ▲                       │
    └──── reads signals ────┘
```

### Folder structure

```
src/app/
  core/            # singletons: services, interceptors, guards, models
    models/
    services/
    interceptors/
    guards/
  shared/          # reusable UI: components, directives, pipes
    components/
    directives/
    pipes/
  features/
    tasks/         # task list, detail and form (lazy loaded)
    projects/      # project management (lazy loaded)
  app.config.ts    # providers (router, http, etc.)
  app.routes.ts
```

### Routes

| Path         | Component           | Notes                                 |
| ------------ | ------------------- | ------------------------------------- |
| `''`         | —                   | Redirects to `/tasks`                 |
| `/tasks`     | `TaskListComponent` | Lazy loaded                           |
| `/tasks/new` | `TaskFormPage`      | `unsavedChangesGuard`                 |
| `/tasks/:id` | `TaskFormPage`      | The `id` arrives as a component input |
| `/projects`  | `ProjectsPage`      | Lazy loaded                           |
| `**`         | `NotFoundPage`      |                                       |

## Data model

```ts
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string; // ISO date
  tags: string[];
  projectId: string;
  order: number; // for drag and drop
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}
```

### Storage (localStorage)

All data is saved under one key, `angular-tasklist`, as JSON:

```ts
interface StoredData {
  version: number; // schema version, bumped when the shape changes
  tasks: Task[];
  projects: Project[];
}
```

- **First visit:** the key is missing, so the app loads `public/seed.json` with `HttpClient` and saves it.
- **Load:** parse the JSON, run migrations if `version` is older, and fall back to the seed data if it is invalid.
- **Save:** write after every change made through the store.
- **Other tabs:** listen to the `storage` event so two open tabs stay in sync.
- **Filtering and search** happen in memory with `computed`, since all data is already loaded.
- **IDs:** `crypto.randomUUID()`.

## Deployment (GitHub Pages)

- The site is served at `https://devsuperman.github.io/angular-tasklist/`, so the deploy build uses `npm run build:pages` (`ng build --base-href /angular-tasklist/`). Local development keeps `<base href="/">`.
- GitHub Pages has no SPA fallback. After the build, copy `index.html` to `404.html` so deep links like `/tasks/123` load the app on refresh.
- The workflow `.github/workflows/deploy.yml` runs on push to `main` (or manually): `npm ci` → lint → test → `build:pages` → upload `dist/angular-tasklist/browser` → `actions/deploy-pages`.
- In the repo settings, **Pages → Source** must be set to **GitHub Actions**.

## Conventions

- **Components:** standalone, `ChangeDetectionStrategy.OnPush`, signal-based `input()` / `output()` / `model()`.
- **Dependency injection:** use `inject()`, not constructor injection.
- **Templates:** built-in control flow (`@if`, `@for`), not `*ngIf` / `*ngFor`.
- **State:** private writable signals inside stores, exposed as read-only (`asReadonly()`) or as `computed`.
- **Naming:** `task-list.ts`, `task-store.ts`, `relative-date.pipe.ts`; kebab-case files.
- **Git:** one branch and pull request per phase (`phase-01-components`, ...); conventional commit messages.

## Angular concept checklist

Mark each item once it is used in the code.

- [x] Standalone components and templates
- [x] Control flow (`@if`, `@for`, `@switch`, `@let`, `@defer`)
- [x] Signals: `signal`, `computed`, `effect`, `linkedSignal`, `resource`
- [x] Signal-based `input` / `output` / `model` / `viewChild`
- [x] Content projection
- [x] Lifecycle hooks and `DestroyRef`
- [x] Services, `inject()`, providers, `InjectionToken`
- [x] Router: lazy loading, functional guards, resolvers, input binding
- [x] Reactive forms, typed forms, custom validators, `ControlValueAccessor`
- [x] Template-driven forms
- [x] `HttpClient` (seed data), an interceptor, RxJS operators, RxJS ↔ signals interop
- [x] Custom directives (attribute and structural) and pipes
- [x] Angular CDK / Material
- [x] Unit, component and e2e testing
- [x] i18n, PWA, CI/CD and deployment to GitHub Pages

## References

- Official docs and tutorials: https://angular.dev
- Angular CLI: https://angular.dev/tools/cli
- Deploying Angular: https://angular.dev/tools/cli/deployment
- GitHub Pages with Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

# Tech Stack Plan — Angular Tasklist

The technical decisions, architecture and conventions for the project. For what the product does, see [BUSINESS_PLAN.md](BUSINESS_PLAN.md). For the work broken into steps, see [TASKS.md](TASKS.md).

## Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Latest stable Angular, standalone components (no NgModules) | The current recommended way to write Angular |
| Reactivity | Signals (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) + RxJS for HTTP and streams | Signals are Angular's main reactivity model; RxJS is still used for async streams |
| Change detection | Zoneless (the default in new projects since Angular 21) | Matches modern Angular and forces a clear understanding of signals |
| Language | TypeScript in strict mode | Catches errors early, and typed forms need it |
| Styling | SCSS; Angular Material + CDK later (phase 8) | SCSS is simple to start with; the CDK gives drag and drop, overlays and a11y |
| Fake backend | `json-server` serving `db.json` | A real REST API without writing a backend |
| Unit tests | Vitest (the Angular CLI default) + Angular testing utilities | Fast, and the default for new projects |
| E2E tests | Playwright | Reliable cross-browser tests |
| Code quality | ESLint (`@angular-eslint`), Prettier | Consistent style and catches mistakes |
| CI/CD | GitHub Actions; deploy to GitHub Pages, Firebase or Vercel | Free and integrated with the repo |
| Later | `@angular/ssr`, `@angular/localize`, `@angular/pwa` | SSR and hydration, i18n, offline support |

## Architecture

### Layers

- **Components** show data and send user events. They hold no business logic.
- **Stores** (services that keep state in signals) own the app state and the business rules.
- **API services** talk to the backend with `HttpClient` and return typed data.
- **Interceptors** handle cross-cutting concerns: the auth header, errors, the loading indicator.

```
Component  ──calls──▶  Store (signals)  ──calls──▶  API service  ──HTTP──▶  json-server
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
    auth/          # fake login page
  app.config.ts    # providers (router, http, etc.)
  app.routes.ts
```

### Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/login` | `LoginPage` | Public |
| `/tasks` | `TaskListPage` | Lazy loaded, `authGuard` |
| `/tasks/new` | `TaskFormPage` | `unsavedChangesGuard` |
| `/tasks/:id` | `TaskFormPage` | The `id` arrives as a component input |
| `/projects` | `ProjectsPage` | Lazy loaded, `authGuard` |
| `**` | `NotFoundPage` | |

## Data model

```ts
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;      // ISO date
  tags: string[];
  projectId: string;
  order: number;         // for drag and drop
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}
```

### API (json-server)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/tasks?projectId=&done=&q=` | List, filter and search |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create |
| PATCH | `/tasks/:id` | Partial update (toggle, reorder) |
| DELETE | `/tasks/:id` | Delete |
| GET / POST / PATCH / DELETE | `/projects[/:id]` | Project CRUD |

## Conventions

- **Components:** standalone, `ChangeDetectionStrategy.OnPush`, signal-based `input()` / `output()` / `model()`.
- **Dependency injection:** use `inject()`, not constructor injection.
- **Templates:** built-in control flow (`@if`, `@for`), not `*ngIf` / `*ngFor`.
- **State:** private writable signals inside stores, exposed as read-only (`asReadonly()`) or as `computed`.
- **Naming:** `task-list.ts`, `task-store.ts`, `relative-date.pipe.ts`; kebab-case files.
- **Git:** one branch and pull request per phase (`phase-01-components`, ...); conventional commit messages.

## Angular concept checklist

Mark each item once it is used in the code.

- [ ] Standalone components and templates
- [ ] Control flow (`@if`, `@for`, `@switch`, `@let`, `@defer`)
- [ ] Signals: `signal`, `computed`, `effect`, `linkedSignal`, `resource`
- [ ] Signal-based `input` / `output` / `model` / `viewChild`
- [ ] Content projection
- [ ] Lifecycle hooks and `DestroyRef`
- [ ] Services, `inject()`, providers, `InjectionToken`
- [ ] Router: lazy loading, guards, resolvers, input binding
- [ ] Reactive forms, typed forms, custom validators, `ControlValueAccessor`
- [ ] Template-driven forms
- [ ] `HttpClient`, interceptors, RxJS operators, RxJS ↔ signals interop
- [ ] Custom directives (attribute and structural) and pipes
- [ ] Angular CDK / Material
- [ ] Unit, component and e2e testing
- [ ] SSR / hydration, i18n, PWA, CI/CD

## References

- Official docs and tutorials: https://angular.dev
- Angular CLI: https://angular.dev/tools/cli
- json-server: https://github.com/typicode/json-server

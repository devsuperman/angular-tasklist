# Notes

What I learned in each phase.

## Phase 0 — Setup and tooling

- `ng new` (Angular 22) creates a standalone, zoneless app with no NgModules. Vitest is the default test runner and Prettier is configured out of the box.
- `src/main.ts` calls `bootstrapApplication(App, appConfig)`: the root component plus a list of app-wide providers.
- `src/app/app.config.ts` holds those providers. Right now: `provideBrowserGlobalErrorListeners()` and `provideRouter(routes)`. HTTP, interceptors and so on will be added here later.
- `src/app/app.ts` is the root component. `templateUrl` and `styleUrl` point to `app.html` and `app.scss`; `imports` lists what the template uses (`RouterOutlet`).
- `angular.json` defines the `build`, `serve`, `test` and `lint` targets. `ng add angular-eslint` added the `lint` target and `eslint.config.js` (flat config).
- `eslint-config-prettier` is last in `eslint.config.js` so ESLint does not fight Prettier over formatting.
- The Angular 22 CLI needs Node 22.22.3+ or 24.15+.
- Folder layout: `core/` (singletons, models, guards, interceptors), `shared/` (reusable components, directives, pipes), `features/` (lazy-loaded pages). Empty folders hold a `.gitkeep` until they get real files.

## Phase 1 — Components and templates

- The model comes first: `Task` and `Project` are interfaces in `core/models/`, because the data comes from JSON (plain objects, not class instances). `Priority` is a union type, so the template type checker rejects unknown values.
- `TaskListComponent` holds a hard-coded array in a `signal` and renders it with `@for (...; track task.id)`. `@empty` shows the empty state without an extra `@if`.
- `TaskItemComponent` renders one row. `@let t = task();` reads the input once and gives the template a short name.
- The priority badge uses `@switch`; the "done" style uses `[class.done]`. `[attr.aria-label]` is needed because ARIA attributes have no DOM property.
- Component styles are scoped to the component. Colors are CSS custom properties in `styles.scss`, so a dark theme later only has to redefine the tokens.

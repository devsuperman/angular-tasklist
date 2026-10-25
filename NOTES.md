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

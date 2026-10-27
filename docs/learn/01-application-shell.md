# Chapter 1 — The application shell

**Phase 0** · Concepts: Angular CLI, workspace files, `bootstrapApplication`, `ApplicationConfig`, providers, the root component.

Before you write a single feature, you need to know how an Angular app starts. This chapter follows the path from the moment the browser opens `index.html` to the moment the `Tasklist` title appears on screen. All the code in this chapter is 🟢 **in the code today**.

---

## 1.1 The Angular CLI and the workspace

### What

The Angular CLI (`ng`) is the command-line tool that creates, runs, tests and builds Angular apps. The folder it creates is a **workspace**. Its settings live in `angular.json`.

### Why

An Angular app is TypeScript, HTML templates and SCSS that must be compiled, bundled and optimized before a browser can run them. Doing that by hand (configuring a compiler, a bundler, a dev server, a test runner) is a lot of work. The CLI hides it behind a few commands, and every Angular project uses the same structure, so you can open any Angular repo and find your way around.

### How it is applied here

The scripts in `package.json` are thin wrappers over the CLI:

| Script          | Runs       | `angular.json` target | Builder                        |
| --------------- | ---------- | --------------------- | ------------------------------ |
| `npm start`     | `ng serve` | `serve`               | `@angular/build:dev-server`    |
| `npm run build` | `ng build` | `build`               | `@angular/build:application`   |
| `npm test`      | `ng test`  | `test`                | `@angular/build:unit-test`     |
| `npm run lint`  | `ng lint`  | `lint`                | `@angular-eslint/builder:lint` |

A **target** is a named task, and a **builder** is the code that runs it. Open `angular.json` and look at `projects.angular-tasklist.architect`: each key there is a target.

Some settings in `angular.json` worth knowing:

```jsonc
"prefix": "app",                       // generated selectors start with "app-" (app-root, app-task-item)
"schematics": {
  "@schematics/angular:component": { "style": "scss" }   // `ng generate component` creates .scss files
},
"build": {
  "options": {
    "browser": "src/main.ts",          // the entry point (see 1.3)
    "assets": [{ "glob": "**/*", "input": "public" }],   // files in public/ are copied as-is
    "styles": ["src/styles.scss"]      // global styles
  },
  "defaultConfiguration": "production" // `ng build` is optimized by default
}
```

`serve` uses the `development` configuration by default (no minification, with source maps), so `npm start` is fast to rebuild and easy to debug.

> The `public/` folder matters later: in Phase 6 we put `seed.json` there, and the app loads it with an HTTP request to `seed.json`.

### Useful CLI commands

```bash
ng generate component features/tasks/task-item   # or: ng g c features/tasks/task-item
ng generate service core/services/task-store      # ng g s
ng generate pipe shared/pipes/relative-date       # ng g p
ng generate directive shared/directives/autofocus # ng g d
ng generate guard core/guards/task-exists         # ng g g
```

Add `--dry-run` to see which files would be created without writing them.

---

## 1.2 The TypeScript setup

### What

There are three `tsconfig` files:

- `tsconfig.json`: the shared base.
- `tsconfig.app.json`: the app code (excludes `*.spec.ts`).
- `tsconfig.spec.json`: the tests (adds `vitest/globals`, so `describe`, `it` and `expect` need no import).

### Why

Angular depends on TypeScript's types. Typed forms (Chapter 7), signal inputs (Chapter 4) and dependency injection (Chapter 5) all catch mistakes at compile time instead of at runtime, but only if the compiler is strict.

### How it is applied here

`tsconfig.json` turns on extra checks such as `noImplicitReturns` and `noPropertyAccessFromIndexSignature`. The `angularCompilerOptions` block configures the **Angular compiler**, which also checks your templates:

```jsonc
"angularCompilerOptions": {
  "strictInjectionParameters": true,     // error if DI cannot resolve a parameter
  "strictInputAccessModifiers": true     // respect private/readonly on inputs
}
```

Because of the template type checker, a typo like `{{ task.titel }}` in a template is a **build error**, not a blank space on screen.

---

## 1.3 Bootstrapping: from `index.html` to the root component

### What

**Bootstrapping** is starting the app: Angular creates the root component, puts it into the page and starts listening for changes.

### Why

The browser only understands HTML and JavaScript. Something must connect the static page to the Angular world. That is `bootstrapApplication`.

### How it is applied here

**Step 1 — `src/index.html`** is the only HTML page of the app (that is what "single-page application" means):

```html
<base href="/" />
...
<body>
  <app-root></app-root>
</body>
```

`<app-root>` is an unknown, empty element for now. Angular will fill it in. `<base href="/">` tells the browser and the router where the app lives. It changes to `/angular-tasklist/` on GitHub Pages (Chapter 12).

**Step 2 — `src/main.ts`** is the entry point listed in `angular.json`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

It takes two things:

- `App`: the **root component**. Angular finds the element that matches its selector (`app-root`) and renders the component there.
- `appConfig`: the **app-wide configuration**, mainly a list of providers.

**Step 3 — `src/app/app.config.ts`** lists the providers:

```ts
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
```

---

## 1.4 Providers and `app.config.ts`

### What

A **provider** tells Angular's dependency injection system how to create something (a service, a value, a configuration). Functions named `provideXxx()` return ready-made groups of providers for a feature.

### Why

Features like the router or `HttpClient` need setup (services, configuration, event listeners). Instead of each component setting them up, you turn them on once, at the root, and every component can use them. Chapter 5 explains dependency injection in depth; for now, think of `providers` as "the list of features this app turns on".

### How it is applied here

| Provider                               | What it turns on                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `provideBrowserGlobalErrorListeners()` | Sends uncaught errors and unhandled promise rejections to Angular's `ErrorHandler` |
| `provideRouter(routes)`                | The router, with the routes from `app.routes.ts` (empty for now)                   |

This file will grow as the project grows. Here is a 🔵 **planned** version after Phases 3, 4 and 6:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()), // Chapter 6
    provideHttpClient(withInterceptors([errorInterceptor, loadingInterceptor])), // Chapter 8
    { provide: APP_CONFIG, useValue: { storageKey: 'angular-tasklist', seedUrl: 'seed.json' } }, // Chapter 5
    { provide: StorageService, useClass: LocalStorageService }, // Chapter 5
  ],
};
```

### Zoneless: what is _not_ in the list

Older Angular apps loaded a library called **zone.js**, which patched every browser API (`setTimeout`, clicks, HTTP...) so Angular would know "something may have changed" and re-check the whole page. This project has no `zone.js` in `package.json`, and there is no `provideZoneChangeDetection()` in the providers: since Angular 21, new apps are **zoneless** by default.

Without zones, Angular updates the screen when it is told that something changed: a signal it reads was set, an event bound in a template fired, or `markForCheck()` was called. That is why signals are so central in this project. Chapter 3 explains it in detail.

### No NgModules

You may see `@NgModule` in older tutorials. This project uses **standalone** APIs only: components list their own `imports`, and the app is configured with `bootstrapApplication` + `ApplicationConfig`. NgModules still work, but they are no longer the recommended way to write new code.

---

## 1.5 The root component

### What

The root component is the top of the component tree. Everything else is rendered inside it.

### How it is applied here

`src/app/app.ts`:

```ts
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('Tasklist');
}
```

`src/app/app.html`:

```html
<header class="app-header">
  <h1>{{ title() }}</h1>
</header>

<main>
  <router-outlet />
</main>
```

Every line here is a concept you will see again:

- `@Component({...})` is a **decorator**: metadata that turns a plain class into a component (Chapter 2).
- `selector: 'app-root'` matches `<app-root>` in `index.html`.
- `imports: [RouterOutlet]` declares what the template uses. If you remove it, `<router-outlet />` becomes a compile error (Chapter 2).
- `title = signal('Tasklist')` is a **signal**, and the template reads it by calling it: `title()` (Chapter 3).
- `protected` means "only for this class and its template". Templates can read `protected` members, but other classes cannot. Use it for anything the template needs and nobody else should touch.
- `ChangeDetectionStrategy.OnPush` tells Angular to re-check this component only when its inputs, events or signals change (Chapter 3).
- `<router-outlet />` is where the router will render the current page (Chapter 6).

---

## 1.6 The folder structure

### What and why

Angular does not force a folder structure, but the project follows a common one, described in [TECH_STACK.md](../TECH_STACK.md):

```
src/app/
  core/       # one-instance things: stores, repositories, guards, interceptors, models
  shared/     # reusable UI building blocks: components, directives, pipes
  features/   # pages, grouped by feature; each feature is lazy loaded
```

The rule of thumb: **features** may import from `core/` and `shared/`; `shared/` must not import from `features/`; `core/` must not import UI. That keeps dependencies flowing one way, so you can delete or lazy load a feature without breaking the rest. The empty folders hold a `.gitkeep` file until they get real files.

---

## 1.7 Code quality tools

- **ESLint** (`eslint.config.js`) with `angular-eslint`. Two rules stand out: component selectors must be kebab-case with the `app` prefix (`app-task-item`), and directive selectors must be camelCase with the `app` prefix (`appAutofocus`). The HTML config also turns on `templateAccessibility`, which flags things like images without `alt` (Chapter 10).
- **Prettier** formats the code. `eslint-config-prettier` is last in the ESLint config so the two tools do not argue about formatting.

---

## Try it yourself

1. Run `npm start`, open http://localhost:4200, then change `signal('Tasklist')` to `signal('My tasks')`. Watch the page update without a reload.
2. In `app.ts`, remove `RouterOutlet` from `imports` and run `npm run build`. Read the error, then put it back.
3. In `app.html`, write `{{ titel() }}` and run `npm run build`. Notice that the template is type checked.
4. Run `ng generate component features/tasks/task-list --dry-run` and read which files it would create.
5. Open the browser dev tools on the running app. Find `<app-root>` in the Elements panel and see what Angular rendered inside it.

## Further reading

- [Angular CLI](https://angular.dev/tools/cli)
- [Workspace configuration (`angular.json`)](https://angular.dev/reference/configs/workspace-config)
- [Bootstrapping](https://angular.dev/guide/components) and [Zoneless](https://angular.dev/guide/zoneless)

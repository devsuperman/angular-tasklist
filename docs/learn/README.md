# Learning Angular with this project

A short book in chapters. Each chapter takes one group of Angular concepts and answers three questions:

1. **What is it?** The concept in plain words.
2. **Why do we need it?** The problem it solves, and why this project uses it.
3. **How is it applied here?** The real code in this repo, or the code we plan to write in the matching phase of [TASKS.md](../TASKS.md).

Every chapter marks where its examples live in the code:

- 🟢 **In the code today**: you can open the file and read it.
- 🟢 **Built (Phase N)**: written in that phase. The snippet in the chapter was the plan and is sometimes simplified; the real code can differ. Each chapter ends with an **In this repo** section that lists the real files and the differences.

All phases are done, so every snippet that used to be marked 🔵 **Planned** now exists in some form.

## Chapters

| #   | Chapter                                                             | Phase   | Main concepts                                                      |
| --- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| 1   | [The application shell](01-application-shell.md)                    | 0       | CLI, workspace, `bootstrapApplication`, `app.config.ts`, providers |
| 2   | [Components and templates](02-components-and-templates.md)          | 1       | Standalone components, bindings, `@if`, `@for`, `@switch`, `@let`  |
| 3   | [Signals and change detection](03-signals-and-change-detection.md)  | 2       | `signal`, `computed`, `effect`, `linkedSignal`, zoneless, `OnPush` |
| 4   | [Component communication](04-component-communication.md)            | 2       | `input()`, `output()`, `model()`, `<ng-content>`, `viewChild()`    |
| 5   | [Services and dependency injection](05-services-and-di.md)          | 3       | `@Injectable`, `inject()`, providers, `InjectionToken`             |
| 6   | [Routing](06-routing.md)                                            | 4       | Routes, lazy loading, guards, resolvers, input binding             |
| 7   | [Forms](07-forms.md)                                                | 5       | Reactive and typed forms, validators, `ControlValueAccessor`       |
| 8   | [HTTP, RxJS and persistence](08-http-rxjs-and-persistence.md)       | 6       | `HttpClient`, interceptors, RxJS, `toSignal`, `httpResource`       |
| 9   | [Directives and pipes](09-directives-and-pipes.md)                  | 7       | Attribute and structural directives, `host`, pure pipes            |
| 10  | [Deferred loading, CDK and accessibility](10-defer-cdk-and-a11y.md) | 8       | `@defer`, CDK drag and drop, dialogs, a11y                         |
| 11  | [Testing](11-testing.md)                                            | 9       | Vitest, `TestBed`, testing signals and HTTP, Playwright            |
| 12  | [Build, deploy and production](12-build-and-deploy.md)              | 0.5, 10 | Builds, budgets, base href, GitHub Pages, CI, i18n, PWA            |

## How to use these chapters

- Read the chapter **before** you start its phase. Then do the tasks in [TASKS.md](../TASKS.md).
- Each chapter ends with **Try it yourself** exercises. Do them in the real code.
- After the phase, write what you learned in [NOTES.md](../../NOTES.md) in your own words. If your words differ from the chapter, update the chapter too: it should describe the code as it really is.
- The official docs at [angular.dev](https://angular.dev) are the source of truth. Each chapter links to the matching guide.

## The big picture

This is how the pieces fit once the project is complete. Each box is covered by one or more chapters.

```
                     main.ts ── bootstrapApplication(App, appConfig)      (ch. 1)
                                   │
          app.config.ts ── providers: router, http, interceptors, tokens  (ch. 1, 5, 6, 8)
                                   │
            App (root component) ── <router-outlet />                     (ch. 2, 6)
                                   │
         ┌─────────────────────────┼──────────────────────────┐
   TaskListPage               TaskFormPage               ProjectsPage     (ch. 2, 6, 7)
         │                         │                          │
   TaskItem, FilterBar,       PrioritySelector           (template-driven
   Card, pipes, directives    (ControlValueAccessor)       form)          (ch. 4, 7, 9)
         │                         │                          │
         └──────── read signals / call methods ───────────────┘
                                   │
                   TaskStore, ProjectStore (signals)                       (ch. 3, 5)
                                   │
              DataRepository (one versioned key)                           (ch. 8)
                                   │
              StorageService ── LocalStorageService ── localStorage        (ch. 5, 8)
```

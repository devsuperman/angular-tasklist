# Chapter 12 — Build, deploy and production

**Phase 0.5 and Phase 10** (F11 · languages, F12 · offline) · Concepts: production builds, bundles and chunks, budgets, `--base-href`, SPA fallback, GitHub Pages, GitHub Actions, CI, i18n with `$localize`, PWA and service workers.

---

## 12.1 What `ng build` produces

### What

`ng build` compiles TypeScript and templates **ahead of time** (AOT), bundles the code with esbuild, and writes static files to `dist/angular-tasklist/browser/`:

```
index.html
main-XXXX.js        # the app's starting code
chunk-XXXX.js       # lazy routes and @defer blocks (Chapters 6 and 10)
styles-XXXX.css
favicon.ico         # copied from public/
```

The `XXXX` is a content hash (`"outputHashing": "all"` in `angular.json`). If a file changes, its name changes, so browsers can cache files forever and still get updates.

### Why it matters here

The result is **only static files**. No Node.js server is needed to run the app. That is why it can be hosted on GitHub Pages for free, and why the project has no server-side rendering ([TECH_STACK.md](../TECH_STACK.md)).

### Production vs development

🟢 **In the code today** (`angular.json`):

|                          | `production` (default for `build`) | `development` (default for `serve`) |
| ------------------------ | ---------------------------------- | ----------------------------------- |
| Minified and tree-shaken | Yes                                | No                                  |
| Source maps              | No                                 | Yes                                 |
| Hashed file names        | Yes                                | No                                  |
| Budgets checked          | Yes                                | No                                  |

---

## 12.2 Budgets

🟢 **In the code today**:

```jsonc
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
]
```

- **`initial`**: the JavaScript and CSS needed for the first page. Over 500 kB is a warning; over 1 MB **fails the build**.
- **`anyComponentStyle`**: each component's stylesheet.

### Why

Bundle size grows quietly, one import at a time. A budget turns "the app got slow" into a red build you notice the same day. If the initial budget is hit, the fixes are usually: lazy load a route (Chapter 6), `@defer` a heavy component (Chapter 10), or remove a big dependency.

To see what is inside the bundle (Phase 10):

```bash
ng build --stats-json
npx esbuild-visualizer --metadata dist/angular-tasklist/stats.json --open
```

---

## 12.3 Deploying to GitHub Pages

🟢 **In the code today**. This part of the project is done (Phase 0.5).

### Problem 1: the app is not at the root

The site is `https://devsuperman.github.io/angular-tasklist/`, not `https://devsuperman.github.io/`. The `<base href="/">` in `index.html` would make the browser look for `/main-XXXX.js` at the domain root, which does not exist.

**Fix:** build with a different base href.

```json
"build:pages": "ng build --base-href /angular-tasklist/ && node -e \"require('fs').copyFileSync('dist/angular-tasklist/browser/index.html', 'dist/angular-tasklist/browser/404.html')\""
```

`--base-href /angular-tasklist/` rewrites `<base href>` in the built `index.html`. All relative URLs (scripts, `seed.json`, router links) then resolve under `/angular-tasklist/`. Local development keeps `/`. This is why Chapter 8 insists on **relative** URLs like `seed.json`, not `/seed.json`.

### Problem 2: deep links on refresh

The router handles `/angular-tasklist/tasks/123` **in the browser**. But on refresh, the browser asks the **server** for that path, and GitHub Pages has no such file. It would answer with its own 404 page.

**Fix:** the second half of `build:pages` copies `index.html` to `404.html`. GitHub Pages serves `404.html` for unknown paths, which is our app, and the router reads the URL and shows the right page. (The HTTP status is still 404, which does not matter for this app, but it is why real apps use a server with proper SPA fallback.)

### The workflow

🟢 `.github/workflows/deploy.yml`, on every push to `main`:

```
checkout → setup-node (version from .nvmrc, npm cache)
        → npm ci → npm run lint → npm test -- --watch=false → npm run build:pages
        → upload-pages-artifact (dist/angular-tasklist/browser)
        → deploy-pages
```

- **`npm ci`** installs exactly what `package-lock.json` says. Reproducible builds.
- **Lint and tests run before the build**: a failing test stops the deploy. Bad code never goes live.
- **`permissions`** gives the job only what it needs (`pages: write`, `id-token: write`).
- **`concurrency: pages`** stops two deploys from running at the same time.
- In the repo, **Settings → Pages → Source** must be **GitHub Actions** (still unchecked in [TASKS.md](../TASKS.md)).

### CI for pull requests (Phase 10)

The deploy workflow only runs on `main`. Phase 10 adds a `ci.yml` that runs lint, test and build on **every push and pull request**, so problems show up in review, before merging.

---

## 12.4 Internationalization (F11)

### What

Angular's built-in i18n marks text in templates and code, extracts it into translation files, and builds **one copy of the app per language**.

```bash
ng add @angular/localize
```

```html
<h1 i18n="@@appTitle">Tasklist</h1>
<button i18n="@@addTask">Add task</button>
<p i18n>{count, plural, =0 {No tasks} =1 {One task} other {{{count}} tasks}}</p>
```

```ts
const message = $localize`:@@taskDeleted:Task deleted`;
```

```bash
ng extract-i18n --output-path src/locale    # creates messages.xlf
# translate into messages.pt-BR.xlf
```

Built-in pipes (`date`, `number`, `percent`) follow the locale automatically, and `inject(LOCALE_ID)` gives it to your code (for example to `Intl.RelativeTimeFormat` in the `relativeDate` pipe, Chapter 9).

### Why it is tricky here

Compile-time i18n produces `/en/` and `/pt-BR/` folders, each with its own base href. Under GitHub Pages that becomes `/angular-tasklist/en/` and `/angular-tasklist/pt-BR/`, and the `404.html` trick must work for both. TASKS.md asks you to check this. The alternative is loading translations at runtime with a library, which keeps one build. Comparing the two is part of the phase.

---

## 12.5 PWA: offline and installable (F12)

### What

A **Progressive Web App** can be installed like a native app and works offline. Angular's support:

```bash
ng add @angular/pwa
```

This adds:

- a **web app manifest** (`manifest.webmanifest`): name, icons, colors, so the browser can offer "Install";
- a **service worker** (`ngsw-config.json`): a script that caches the app's files and serves them when the network is down;
- `provideServiceWorker(...)` in `app.config.ts`.

### Why it fits this app

All data is already in `localStorage`. Once the files are cached, the app works **fully offline**. Very few apps can say that.

### Things to check

- The service worker **scope** must be `/angular-tasklist/` on GitHub Pages (the base href takes care of it, but verify it in DevTools → Application → Service Workers).
- The service worker only runs in **production builds** served over HTTPS (or `localhost`). Test with a production build, not `ng serve`.
- Updates: a new deploy is downloaded in the background. `SwUpdate` lets you show "A new version is available. Reload?".

---

## Pitfalls

- **Absolute URLs** (`/seed.json`, `href="/tasks"`): they ignore the base href and break on GitHub Pages.
- **Ignoring budget warnings** until they become errors.
- **Deploying without running tests**: the workflow prevents this; keep it that way.
- **Caching `index.html` forever**: it must stay fresh so it can point to the new hashed files (GitHub Pages and the service worker handle this for you).

## Try it yourself

1. Run `npm run build` and read the output table: initial chunks, lazy chunks, sizes.
2. Run `npm run build:pages` and open `dist/angular-tasklist/browser/index.html`. Find the `<base href>`.
3. Serve the build locally under the same path to test it like GitHub Pages, for example: `mkdir -p /tmp/site && cp -r dist/angular-tasklist/browser /tmp/site/angular-tasklist && npx http-server /tmp/site`, then open `http://localhost:8080/angular-tasklist/`.
4. Lower the `initial` budget to `100kB` and build. Read the error, then put it back.
5. Read `.github/workflows/deploy.yml` and the last run under the repo's **Actions** tab.
6. After Phase 4, refresh a deep link on the live site and check it loads.

## Further reading

- [Building and serving](https://angular.dev/tools/cli/build)
- [Deployment](https://angular.dev/tools/cli/deployment)
- [Internationalization](https://angular.dev/guide/i18n)
- [Service workers and PWA](https://angular.dev/ecosystem/service-workers)
- [GitHub Pages with custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

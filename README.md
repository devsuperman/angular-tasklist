# angular-tasklist

[![CI](https://github.com/devsuperman/angular-tasklist/actions/workflows/ci.yml/badge.svg)](https://github.com/devsuperman/angular-tasklist/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/devsuperman/angular-tasklist/actions/workflows/deploy.yml/badge.svg)](https://github.com/devsuperman/angular-tasklist/actions/workflows/deploy.yml)

**Live demo:** https://devsuperman.github.io/angular-tasklist/

My Angular study project: a task list app built step by step to learn Angular's main features.

## Features

- Tasks with title, description, priority, due date, project and tags; create, edit, delete (with confirmation) and mark as done
- Projects with a color: create, rename, delete
- Filters (all / pending / done, by project), search while typing, and counters (total, done, pending, overdue)
- Overdue tasks highlighted, relative dates ("in 3 days")
- Drag and drop to reorder (also with the arrow keys), a statistics panel, dark mode
- English and Portuguese (pt-BR), installable and works offline (PWA)
- No account and no server: data stays in this browser's `localStorage`, and two open tabs stay in sync

## Docs

- [Business plan](docs/BUSINESS_PLAN.md): product vision, scope, user stories, success criteria
- [Tech stack plan](docs/TECH_STACK.md): stack, architecture, data model, conventions
- [Tasks](docs/TASKS.md): the work broken into phases and checklists
- [Learning Angular with this project](docs/learn/README.md): chapters that explain each Angular concept, why it is used and how it is applied here

## Getting started

Requires Node.js 22.22.3+ or 24.15+ (see `.nvmrc`).

```bash
npm install
npm start              # dev server at http://localhost:4200
npm test               # unit and component tests (Vitest)
npm run e2e            # end-to-end tests (Playwright) against the GitHub Pages build
npm run lint           # ESLint (angular-eslint)
npm run format         # Prettier
npm run build          # production build in dist/
npm run build:pages    # GitHub Pages build (base href /angular-tasklist/ + 404.html)
npm run i18n           # extract messages and rebuild the pt-BR translation file
```

First time running e2e tests locally: `npx playwright install chromium`.

To add or change text: mark it with `i18n` (templates) or `$localize` (code), add the Portuguese text to `scripts/pt-BR.translations.json`, and run `npm run i18n`. The script fails if a translation is missing.

## Deployment

Every push to another branch, and every pull request, runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Both run the format check, lint, unit tests, `npm run build:pages` and the e2e tests; the deploy workflow then publishes to GitHub Pages. The repo setting **Settings → Pages → Source** must be **GitHub Actions**.

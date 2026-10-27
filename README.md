# angular-tasklist

[![Deploy to GitHub Pages](https://github.com/devsuperman/angular-tasklist/actions/workflows/deploy.yml/badge.svg)](https://github.com/devsuperman/angular-tasklist/actions/workflows/deploy.yml)

**Live demo:** https://devsuperman.github.io/angular-tasklist/

My Angular study project: a task list app built step by step to learn Angular's main features.

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
npm test               # unit tests (Vitest)
npm run lint           # ESLint (angular-eslint)
npm run format         # Prettier
npm run build          # production build in dist/
npm run build:pages    # GitHub Pages build (base href /angular-tasklist/ + 404.html)
```

## Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): lint, test, `npm run build:pages`, then publish to GitHub Pages. The repo setting **Settings → Pages → Source** must be **GitHub Actions**.

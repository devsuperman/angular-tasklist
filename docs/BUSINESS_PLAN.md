# Business Plan — Angular Tasklist

## Purpose

This is a study project. The goal is to learn Angular's main features by building one realistic product, a task list app. The "business" here is the product we pretend to ship. Defining it the way a real product would be defined gives the technical work clear requirements.

## Product vision

A simple, fast task manager for one person. It groups tasks into projects, shows what is due soon, and stays usable on mobile and desktop. It runs entirely in the browser: no account, no server, and data is saved in `localStorage`.

## Target user

- **Persona:** a person who manages personal and work to-dos across a few projects (study, work, home).
- **Needs:** capture tasks quickly, see what is pending or overdue, organize by project and priority.
- **Pain points with existing tools:** too many features, slow, cluttered.

## Value proposition

- Add a task in a few seconds.
- See at a glance what is overdue and what is due today.
- No clutter: projects, priorities, tags and due dates, and nothing more.
- No sign-up: open the page and start using it.

## Scope

### MVP (must have)

| #   | Feature                     | Description                                             |
| --- | --------------------------- | ------------------------------------------------------- |
| F1  | Task list                   | See all tasks with title, priority, due date and status |
| F2  | Create / edit / delete task | A form with validation                                  |
| F3  | Mark as done                | Toggle a task's status from the list                    |
| F4  | Filters                     | All / Pending / Done, plus filtering by project         |
| F5  | Search                      | Search tasks by title, with results while typing        |
| F6  | Projects                    | Create, rename and delete projects, each with a color   |
| F7  | Counters                    | Total, done, pending and overdue                        |

### Later (nice to have)

| #   | Feature               | Description                             |
| --- | --------------------- | --------------------------------------- |
| F8  | Drag and drop         | Reorder tasks by hand                   |
| F9  | Statistics panel      | A chart of done vs. pending per project |
| F10 | Dark mode             | Switch between light and dark themes    |
| F11 | Multiple languages    | English and Portuguese (pt-BR)          |
| F12 | Offline / installable | Works as a PWA                          |

### Out of scope

- Multiple users, sharing, or real-time collaboration
- A backend or an API server: all data stays in the browser's `localStorage`
- Authentication of any kind (no login, no accounts)
- Syncing data between browsers or devices
- Notifications or email reminders

## User stories

- As a user, I want to **add a task with a title, priority and due date** so I can remember what to do.
- As a user, I want to **mark a task as done** so I can track progress.
- As a user, I want to **filter by status and project** so I can focus.
- As a user, I want to **search tasks by title** so I can find one quickly.
- As a user, I want **overdue tasks highlighted** so I don't miss deadlines.
- As a user, I want to **be warned before leaving a form with unsaved changes** so I don't lose work.
- As a user, I want to **confirm before deleting** so I don't remove tasks by accident.
- As a user, I want **my tasks to still be there when I come back** so I don't have to sign in or re-enter anything.

## Success criteria

### Product

- All MVP features work end to end, and the data survives a page reload.
- Lighthouse accessibility score above 90, and the layout works on mobile.
- A public demo on GitHub Pages: https://devsuperman.github.io/angular-tasklist/

### Learning (the real goal)

- Every item in the concept checklist in [TECH_STACK.md](TECH_STACK.md) has been used in the code at least once.
- Each phase in [TASKS.md](TASKS.md) has a pull request that summarizes what was learned.
- Automated tests cover the core logic, and CI runs on every push.

## Milestones

| Milestone              | Phases (see TASKS.md) | Outcome                                              |
| ---------------------- | --------------------- | ---------------------------------------------------- |
| M1 — Working prototype | 0–3                   | In-memory task list with state in a service          |
| M2 — Full MVP          | 4–7                   | Routing, forms, persistence, RxJS, directives, pipes |
| M3 — Polished product  | 8–9                   | UI polish and a test suite                           |
| M4 — Production        | 10                    | i18n, PWA, CI and deployment to GitHub Pages         |

## Risks

| Risk                               | Mitigation                                            |
| ---------------------------------- | ----------------------------------------------------- |
| Scope grows and the project stalls | Finish the MVP before any "later" feature             |
| Angular APIs change (new versions) | Follow angular.dev and pin versions in `package.json` |
| Learning stays shallow             | Write notes in `NOTES.md` after each phase            |
| Data lives in one browser only     | Seed demo data on first visit; say so in the UI       |
| Stored data shape changes later    | Save a schema `version` and migrate on load           |

# Contributing to OpenGify

A two-person team project: Keval owns the backend, Piyush owns the frontend.
These are the few rules that keep both sides in sync.

## Setup

Follow the Quick start in the [README](README.md). Each side also has its own
notes: [backend/README.md](backend/README.md) and
[frontend/README.md](frontend/README.md).

## The API contract is law

`openapi.yaml` at the repo root is the contract of record between the backend
and the frontend.

- Never change a request or response shape unilaterally.
- Contract changes are **additive** and are agreed by both sides **first** —
  then the endpoint, the frontend types, and the tests follow.

## Commits

- Small, verified commits, pushed straight to `main` — no long-lived branches.
- Conventional prefixes, as in the history: `feat:`, `fix:`, `test:`,
  `docs:`, `chore:` — usually scoped, e.g. `feat(backend): ...`,
  `feat(frontend): ...`.
- One logical change per commit, so any commit can be understood (or reverted)
  on its own.

## Before you push

Run the tests for what you touched — ideally all three suites:

```bash
cd backend && python -m pytest    # 34 tests, in-memory SQLite
cd frontend && npm run test       # 61 Vitest tests
cd frontend && npm run test:e2e   # 8 Playwright tests (needs both servers up)
```

If a suite fails, fix it or say so — don't push red and hope.

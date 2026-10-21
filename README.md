<p align="center">
  <img src="frontend/public/logo.svg" alt="OpenGify logo" width="96" />
</p>

# OpenGify

[![CI](https://github.com/yantra3loka/OpenGify/actions/workflows/ci.yml/badge.svg)](https://github.com/yantra3loka/OpenGify/actions/workflows/ci.yml)

A Giphy-style GIF sharing platform — an open-source contribution project by Yantra3loka LLP.

Upload, discover, and share animated GIFs.

## Team

| Member        | Ownership              |
|---------------|------------------------|
| Keval Shah    | Backend (FastAPI)      |
| Piyush Ghadge | Frontend (Vue 3 + TS)  |

## Features

- **Accounts** — register and log in with JWT authentication (24-hour token)
- **GIF uploads** — with a title, description, and tags
- **Discovery** — home feed, full-text search, and a trending view (most-liked first)
- **Likes and view counts** on every GIF
- **Embed codes** — direct URL, HTML, and Markdown snippets on every GIF detail page
- **Download button** — saves the actual GIF file, served by the backend
- **Public profiles** — stats plus Uploads and Liked tabs
- **Account recovery and editing** — forgot password (email + new password) and an
  edit-profile section to rename your username or change your password
- **4 colour themes** — Paper, Midnight, Neon, and Ocean, remembered per browser
- **Seeded demo data** — 3 demo users and 25 real GIFs out of the box

## Tech stack

| Layer    | Technology                                                          |
|----------|---------------------------------------------------------------------|
| Backend  | FastAPI + SQLModel, PostgreSQL (local), JWT (python-jose + passlib) |
| Frontend | Vue 3 + Vite + TypeScript, Tailwind CSS, TanStack Query             |
| Tests    | pytest (backend), Vitest (frontend), Playwright (E2E)               |

GIF files are stored on the local filesystem (`backend/uploads/`); all metadata lives in PostgreSQL.

## Quick start

### Prerequisites

- Python 3.12
- Node 22+
- PostgreSQL running locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create the database and your local env file:

```bash
createdb opengiphy        # or: CREATE DATABASE opengiphy; in psql
cp .env.example .env      # set DATABASE_URL / JWT_SECRET
```

Run the API:

```bash
uvicorn app.main:app --port 8000
```

Tables are created automatically on startup.

### Seed demo data

```bash
cd backend
python seed.py
```

Demo accounts:

- `demo@example.com` / `demo1234`
- `alice@example.com` / `alice1234`
- `bob@example.com` / `bob1234`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the app at **http://localhost:5173**.

## Testing

| Suite           | Where      | Command              | Tests |
|-----------------|------------|----------------------|-------|
| Backend         | `backend/` | `python -m pytest`   | 34    |
| Frontend unit   | `frontend/`| `npm run test`       | 61    |
| Frontend E2E    | `frontend/`| `npm run test:e2e`   | 8     |

Backend tests run against in-memory SQLite, so they don't need PostgreSQL.
The Playwright E2E suite drives the real app in a browser: it needs both
servers running with the seeded demo data, plus a one-time
`npx playwright install chromium`.

## API contract

`openapi.yaml` at the repo root is the contract of record — the frozen API contract shared by the backend and the frontend. Never change a request/response shape without agreeing with the other side first; contract changes are additive.

## Repository structure

```
OpenGify/
├── openapi.yaml            # API contract — source of truth for both sides
├── README.md
├── CONTRIBUTING.md
├── .github/workflows/      # CI (backend pytest + frontend Vitest/build)
├── backend/                # FastAPI application
│   ├── app/                # config, db, models, schemas, auth, routers
│   ├── tests/              # pytest suite
│   ├── seed.py             # demo-data seeder
│   ├── seed_assets/        # the 25 real GIFs bundled for seeding
│   ├── uploads/            # local GIF storage (git-ignored)
│   └── requirements.txt
└── frontend/               # Vue 3 application
    ├── src/                # api, components, composables, pages, router
    ├── e2e/                # Playwright specs
    ├── playwright.config.ts
    └── public/             # logo and static assets
```

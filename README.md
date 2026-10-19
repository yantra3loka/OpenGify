# OpenGify

A Giphy-style GIF sharing platform — an open-source contribution project by Yantra3loka LLP.

Upload, discover, and share animated GIFs: JWT authentication, GIF uploads with tags,
search, trending, likes, view counts, embed codes, and public user profiles.

## Team

| Member        | Ownership              |
|---------------|------------------------|
| Keval Shah    | Backend (FastAPI)      |
| Piyush Ghadge | Frontend (Vue 3 + TS)  |

## Tech stack

| Layer    | Technology                                                        |
|----------|-------------------------------------------------------------------|
| Backend  | FastAPI + SQLModel, PostgreSQL (local), JWT (python-jose + passlib) |
| Frontend | Vue 3 + Vite + TypeScript, Tailwind CSS, TanStack Query            |
| Tests    | pytest (backend), Vitest (frontend)                               |

GIF files are stored on the local filesystem (`backend/uploads/`); all metadata lives in PostgreSQL.

## Repository structure

```
OpenGify/
├── openapi.yaml        # Frozen API contract — source of truth for both sides
├── backend/            # FastAPI application
│   ├── app/            # config, db, models, schemas, auth, routers
│   ├── tests/          # pytest suite
│   ├── seed.py         # demo-data seeder (3 users, 10 generated GIFs)
│   └── uploads/        # local GIF storage (git-ignored)
└── frontend/           # Vue 3 application
```

## Quickstart

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL / JWT_SECRET
uvicorn app.main:app --reload --port 8000
```

### Seed demo data

```bash
cd backend
python seed.py
```

Demo logins: `demo@opengiphy.local` / `demo1234`, `alice@opengiphy.local` / `alice1234`,
`bob@opengiphy.local` / `bob1234`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API contract

`openapi.yaml` is the frozen contract shared by the backend and the frontend.
Never change a request/response shape without agreeing with the other side first.

## Branching & reviews

- `backend/*` branches belong to Keval, `frontend/*` branches to Piyush.
- Never push to `main` directly — open a pull request, get the other person's review, then merge.
- Tests ride along with every feature.

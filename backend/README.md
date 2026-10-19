# OpenGIPHY backend (FastAPI)

## Setup
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # adjust DATABASE_URL / JWT_SECRET
```

PostgreSQL must be running, e.g.:
```bash
docker run -d --name opengiphy-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

## Run
```bash
uvicorn app.main:app --reload --port 8000
```
Tables are created automatically on startup (`create_all`, per spec).

## Test
```bash
pytest -q
```
Tests run against in-memory SQLite — no Postgres needed.

## Seed demo data
```bash
pip install -r requirements.txt   # includes pillow for GIF generation
python seed.py            # idempotent: skips users/GIFs that already exist
python seed.py --dry-run  # generate one sample GIF to /tmp, no DB writes
```
Creates 3 demo users and 10 real animated GIFs in the uploads dir,
with views/likes spread so trending + search return meaningful results.

Demo logins:
- `demo@opengiphy.local` / `demo1234`
- `alice@opengiphy.local` / `alice1234`
- `bob@opengiphy.local` / `bob1234`

## Contract
`../openapi.yaml` is the frozen API contract shared with the frontend.

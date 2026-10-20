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
python seed.py            # idempotent: skips users/GIFs that already exist
python seed.py --dry-run  # copy one bundled sample GIF to /tmp, no DB writes
```
Creates 3 demo users and 25 real animated GIFs. The GIF files are bundled in
`seed_assets/` and copied into the uploads dir with uuid filenames (same as
user uploads), with views/likes spread so trending + search return meaningful
results.

Demo logins:
- `demo@example.com` / `demo1234`
- `alice@example.com` / `alice1234`
- `bob@example.com` / `bob1234`

## Contract
`../openapi.yaml` is the frozen API contract shared with the frontend.

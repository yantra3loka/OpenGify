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

## Contract
`../openapi.yaml` is the frozen API contract shared with the frontend.

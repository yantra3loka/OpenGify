# OpenGIPHY — Frontend ↔ Backend Integration Runbook

How Piyush's frontend and Keval's backend come together. The rule for all
of this: **the contract (`openapi.yaml`) is law**. If reality disagrees
with the contract, the contract gets updated first (in the daily sync),
then the code — on whichever side is wrong.

## 0. Before integration day (do this in the next sync)

### The 4 open contract questions (paste-ready for Keval)

> Hey Keval, 4 contract questions from the frontend side — I haven't worked
> around any of these, need your call on each:
>
> 1. **`GET /uploads/{file}` is missing from `openapi.yaml`.** The plan
>    lists it, the contract doesn't. Will `file_url` be an absolute URL or
>    relative? And will it be CORS-safe for `<img>` embedding?
> 2. **Tags encoding on upload.** The contract says "repeated form fields
>    or comma-separated" — which one does your endpoint read? (I'm currently
>    sending repeated `tags` fields.)
> 3. **Token expiry.** Login is described as returning a "token pair" but
>    the schema has only `access_token`, no refresh token. What's the
>    expiry? That decides whether I build a refresh flow or just send the
>    user back to login.
> 4. **Register UX.** `POST /auth/register` returns 201 with the user but
>    no tokens, so my frontend logs in immediately after registering. Is
>    that the intended flow, or would you rather return tokens on register?

Send Keval the above, plus:

**CORS** — without this, the browser blocks every API call and nothing
   works. Keval needs this in his FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # the Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ✅ RESOLVED — Keval's answers (Day 2, 20 Oct) + verification

1. **`/uploads`**: served statically by the backend. `file_url` comes back
   **relative** (`/uploads/x.gif`); the frontend resolves it against the API
   base URL (`resolveFileUrl` in `src/api/client.ts`, used by GifCard,
   GifDetailPage and EmbedCode).
2. **Tags**: upload sends **one comma-separated `tags` field**; responses
   return a JSON array. Frontend changed from repeated fields (Day 2).
3. **Token**: `access_token` only, **24h expiry, no refresh**. On a 401 the
   client clears the token and redirects to `/login` (response interceptor
   in `client.ts`, wired in `main.ts`; `/auth/*` 401s are exempt so a failed
   login still shows its form error).
4. **Register**: returns the user only — the frontend's immediate
   `/auth/login` with the same credentials **is** the intended auto-login.

CORS: already in Keval's app (`allow_origins` includes
`http://localhost:5173`) — verified with a preflight request, Day 2.

**Day-2 verification (20 Oct):** backend run locally (SQLite + `seed.py`),
frontend in real mode (`VITE_USE_MOCKS=false`). 22/22 API-level acceptance
checks passed — register/auto-login, demo login, feed + image serving,
search + tag filter, trending order, upload (comma-separated tags parsed to
an array), like persistence, view-count increment, profile, report, CORS.
**Zero contract mismatches.** Note: the seeded demo login is
`demo@example.com / demo1234` (Keval's `e40ef3c` — `EmailStr` rejects
`.local` addresses, so `demo@opengiphy.local` no longer exists).

## 1. Bring up both sides

| Side     | Command (each in its own terminal) | Must be at            |
| -------- | ---------------------------------- | --------------------- |
| Backend  | Keval's run command (uvicorn)      | `http://localhost:8000` |
| Frontend | `npm run dev`                      | `http://localhost:5173` |

Contract check: `http://localhost:8000/openapi.json` should exist and match
our frozen `openapi.yaml` endpoint-for-endpoint.

## 2. Flip the frontend to the real backend

In `frontend/.env`:

```
VITE_USE_MOCKS=false
```

Restart `npm run dev`. That's the entire code change — `src/api/backend.ts`
swaps the mock implementation for the axios client. If anything behaves
oddly, flip it back to `true`: mocks are the known-good baseline, so this
is also how you bisect a bug (broken in real mode + works in mock mode =
backend/contract issue).

## 3. Walk the acceptance flow (the plan's definition of done)

Do these in order, in the browser, with devtools open on the Network tab:

1. **Register** a new user → lands on home, logged in.
2. **Upload** a real GIF (title + tags) → redirected to its detail page.
3. **Home grid** shows the new GIF.
4. **Search** finds it by title and by tag (`#tag` chips are clickable).
5. **Detail page**: view count went up by 1 vs. the grid.
6. **Like** → heart fills instantly, count +1; refresh → still liked
   (proves `liked_by_me` comes back `true` for the logged-in user).
7. **Unlike** → count back down.
8. **Embed codes** show three snippets; the Direct URL actually loads the
   GIF in a new tab (proves `file_url` is reachable from the browser).
9. **Profile** (`@username`) lists the uploaded GIFs with join date.
10. **Report** a GIF → "thanks" confirmation.
11. **Logout** → Upload link disappears; visiting `/upload` redirects to login.

## 4. When something mismatches

1. Open the failing request in devtools → compare the actual JSON against
   `openapi.yaml`.
2. Decide together which side is wrong.
3. Update the contract first, then fix the code.
4. Frontend mismatches live in exactly one place: `src/api/types.ts`
   (shapes) or `src/api/client.ts` (requests). Backend mismatches are Keval's.

## 5. Gotcha checklist (from experience)

- [ ] CORS configured (see §0) — symptom: all requests fail with no HTTP status.
- [ ] No trailing-slash redirects (`/gifs` vs `/gifs/`) — symptom: POSTs mysteriously failing.
- [ ] `created_at` is an ISO-8601 string, not a timestamp number.
- [ ] `liked_by_me` present and correct when authenticated; absent/`false` when anonymous.
- [ ] `file_url` is absolute (or relative + documented base) and loads in the browser.
- [ ] Pagination: `page`/`page_size`/`total` present; defaults 1/20; max 50.
- [ ] Errors always `{ "detail": "..." }` — the UI renders `detail` verbatim.
- [ ] Upload: which tags encoding did Keval implement? (Frontend sends repeated `tags` fields.)
- [ ] JWT expiry: what happens when it lapses? (Frontend currently expects re-login.)

## 5b. Automated: contract-check.py

The whole §5 checklist (plus the §3 acceptance flow and three of the four
§0 contract questions) runs as one script against Keval's live backend:

    python3 ~/workspace/opengiphy/contract-check.py
    # --base-url http://localhost:8000   (default)
    # --dry-run                          (list checks without sending requests)
    # --contract ./openapi.yaml          (optional: sanity-check the contract file)

Stdlib only — no pip installs, runs on his machine too. It registers a
throwaway user (`check+<uuid>@example.com`) each run, so it never touches
real accounts. Exit 0 = all 16 checks passed, 1 = something failed,
2 = backend not reachable at all.

Three things it answers without asking Keval:
- CORS preflight for `http://localhost:5173` → the §0 CORS question.
- JWT `exp` claim decoded → contract question 3 (token lifetime).
- `file_url` fetched + tags echoed → the `<img>`-embed half of question 1
  and the which-encoding half of question 2.

Run it the moment his API is up on :8000, before the manual §3
walkthrough — anything red gets resolved contract-first, then code.

## 6. Done = merged

Integration is complete when the §3 flow passes end-to-end with zero
workarounds, both test suites are green (`npm test`, `pytest`), and the
change goes through a reviewed PR — no direct pushes to `main`.

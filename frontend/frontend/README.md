# OpenGIPHY — Frontend

Vue 3 + Vite + TypeScript + Tailwind CSS + TanStack Query + Vue Router.
Piyush's side of the OpenGIPHY team project (Yantra3loka open-source contribution).

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_USE_MOCKS=true until Keval's API is live
npm run dev            # http://localhost:5173
```

The real backend (Keval, FastAPI) runs at `VITE_API_URL` (default
`http://localhost:8000`, per the frozen `openapi.yaml`).

## Mock mode

While the backend isn't ready, `VITE_USE_MOCKS=true` serves every endpoint
from `src/api/mockClient.ts` — an in-memory store with the exact contract
shapes (verified by `src/api/mockClient.test.ts` and type-checked against
`BackendApi`). The full flow works end to end: register → login → upload →
search → like → profile. Set it to `false` once the real API is up; the UI
code doesn't change.

## Scripts

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Dev server with hot reload   |
| `npm run build`     | Typecheck + production build |
| `npm run preview`   | Preview the production build |
| `npm test`          | Vitest suite (42 tests)      |
| `npm run typecheck` | TypeScript check without build |

## Layout

```
src/
  api/
    types.ts        TS types mirroring openapi.yaml exactly
    client.ts       axios instance + base URL + bearer auth + endpoint fns
    mockClient.ts   contract-shaped in-memory backend (VITE_USE_MOCKS=true)
    backend.ts      selects real vs mock; type-checked against BackendApi
    queries.ts      TanStack Query composables (feeds, detail, likes, upload…)
    useAuth.ts      login / register / logout (plain composable, no store lib)
    mocks.ts        seed data for the mock backend
  router/           routes + auth guard (/upload requires login)
  pages/            Home, Trending, Search, GifDetail, Upload, Profile,
                    Login, Register
  components/       GifCard, GifGrid, PaginatedGifGrid, LikeButton, TagChip,
                    SearchBar, EmbedCode, PageShell
  composables/      useInfiniteScroll
```

## Contract rules

- `src/api/types.ts` mirrors `openapi.yaml` exactly. Contract change → update types first.
- API errors always surface the contract's `{ detail }` message via `getApiErrorMessage()`.
- `liked_by_me` is optional in the contract (omitted for anonymous) — always
  read it as `gif.liked_by_me ?? false`.
- Upload tags are sent as repeated `tags` multipart fields (see the open
  question with Keval in the sync notes); change it in one place in `client.ts`.

# Atlas Web

The frontend for **Atlas**, a team-management app: workspaces, members, labels,
projects, kanban boards, and tasks. Built with Next.js (App Router) and
shadcn/ui, talking to the Atlas NestJS API.

## Prerequisites

- Node.js 20+ and pnpm
- The Atlas API running locally (see `../api`). By default this app expects it
  at `http://localhost:3001`.

## Getting started

```bash
pnpm install

# Optional — only needed if the API is NOT on http://localhost:3001.
# .env.local is not committed; create it if you need to override the URL.
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`; sign in (or register) and you'll land on your workspaces.

### Scripts

| Command       | Effect                          |
| ------------- | ------------------------------- |
| `pnpm dev`    | Development server (Turbopack)  |
| `pnpm build`  | Production build                |
| `pnpm start`  | Serve the production build      |
| `pnpm lint`   | ESLint                          |

## Configuration

The API base URL is read once at build/runtime:

```ts
// src/lib/api/config.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
```

`NEXT_PUBLIC_API_URL` is the only environment variable this app uses.

## Architecture notes

**Auth.** The access token lives in client memory (Zustand) and is sent as a
bearer token. The refresh token is an **HttpOnly cookie** set by the API, so it
can't be read from JS. A thin BFF layer bridges the cookie:

- `POST /api/auth/session` — read the current session
- `POST /api/auth/refresh` — rotate the refresh token, return a fresh access token
- `POST /api/auth/logout` — clear the cookie

On a `401`, the API client attempts one refresh, retries the original request,
and otherwise clears auth state and redirects to `/login` (preserving the
original URL in `?next=` so deep links — notably emailed invitations — survive
sign-in).

**State.** Zustand stores hold auth, workspace, projects, and the open board's
tasks. Loads are single-flight; mutations patch the store in place rather than
refetching.

**Routing.** Authenticated pages live under `/workspaces/[workspaceId]`, with a
shared shell that loads the workspace once per entry:

```
/workspaces/[workspaceId]/
  projects/                      # list + create
  projects/[projectId]/          # boards + columns
  projects/[projectId]/boards/[boardId]           # kanban
  projects/[projectId]/boards/[boardId]/tasks/[taskId]
  members/
  labels/
  settings/
```

`/workspaces/[workspaceId]` redirects to `./projects`.

## Project structure

```
src/
  app/                 # App Router routes, layouts, BFF route handlers
  components/
    auth/              # login, register, password reset, OAuth
    board/             # kanban board panel
    layout/            # app shell, nav, auth guard
    label/             # workspace label management
    project/           # project list + detail panels
    task/              # task detail panel
    ui/                # shadcn/ui primitives
    workspace/         # workspace shell, members, settings
  lib/
    api/               # typed API client, endpoint modules, entity types
    stores/            # Zustand stores
```

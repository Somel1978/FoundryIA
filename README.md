# Foundry

A self-hosted portfolio for your code projects.

**Public site** — visitors can browse your public projects, read the code with syntax highlighting,
download the source, suggest issues, propose fixes by editing a file in the browser, and download
the releases you've published.

**Admin area** (`/admin`) — create projects, switch them between public and private, upload code
(a `.zip` or a local folder), manage releases and their downloadable files, moderate issues, and
review suggested fixes as diffs and apply them with one click.

## Stack

| Path               | What                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `apps/web`         | Next.js 16 (App Router, Server Actions) + Tailwind CSS v4 + Shiki    |
| `packages/db`      | Drizzle ORM schema, migrations and client (SQLite via better-sqlite3) |
| `packages/storage` | On-disk storage for code snapshots and release files (zip-safe)      |
| `packages/env`     | Shared path resolution (monorepo root, data directory)              |
| `packages/tsconfig`| Shared TypeScript configs                                            |

Managed with **pnpm workspaces** and **Turborepo**.

## Getting started

Requires Node.js 22+ and pnpm 10.

```bash
pnpm install
cp .env.example apps/web/.env.local   # then set ADMIN_PASSWORD and SESSION_SECRET
pnpm db:seed                          # optional: adds a sample public project
pnpm dev                              # http://localhost:3000
```

Sign in at <http://localhost:3000/admin> with `ADMIN_PASSWORD`.

The database is migrated automatically on first use. All runtime data (SQLite DB, code snapshots,
release files) lives in `./data` by default — set `DATA_DIR` to move it. Back that folder up.

## Scripts

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Run the web app in development mode             |
| `pnpm build`       | Production build of all apps                    |
| `pnpm start`       | Start the production build                      |
| `pnpm typecheck`   | Type-check every workspace                      |
| `pnpm test`        | Run unit tests                                  |
| `pnpm db:generate` | Generate a SQL migration after editing `packages/db/src/schema.ts` |
| `pnpm db:migrate`  | Apply migrations explicitly                     |
| `pnpm db:seed`     | Insert a sample project                         |

## How it works

- **Code snapshots.** Each upload becomes an immutable snapshot on disk; one of them is *live* per
  project. You can roll back by making an older snapshot live. Archives with a single top-level
  folder (like GitHub's "Download ZIP") are unwrapped; `.git`, `node_modules` and build folders are
  skipped. Paths are validated to prevent zip-slip / path traversal.
- **Suggested fixes.** A visitor edits one file in the browser; the server stores a unified diff
  against the snapshot they saw. Applying it creates a new live snapshot. If the code moved on in
  the meantime, the diff is re-applied as a patch and conflicts are reported instead of overwriting.
- **Issues** are hidden until you choose to list them publicly, and you can attach a public response.
- **Releases** start as drafts; attach files, then publish. Download counts are tracked.
- **Visibility.** Private projects (and their files, releases and downloads) return 404 to visitors;
  while signed in as admin you can preview them on the public pages.
- **Auth.** Single admin password; sessions are signed JWT cookies (`SESSION_SECRET`). Admin pages,
  server actions and upload endpoints each verify the session. Public forms include a honeypot field.

## Deploying

Any Node host with a persistent disk works (a VPS, Fly.io volume, Railway volume, …):

```bash
pnpm install --frozen-lockfile
pnpm build
DATA_DIR=/var/lib/foundry ADMIN_PASSWORD=… SESSION_SECRET=… pnpm start
```

Serverless platforms without a persistent filesystem are not supported as-is, because the database
and uploads are stored on local disk.

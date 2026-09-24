# FoundryVTTAI

The self-hosted home for FoundryVTTAI's code projects.

**Public site** — visitors can browse your public projects, read the code with syntax highlighting,
download the source, suggest issues, propose fixes by editing a file in the browser, and download
the releases you've published.

Each project page has a cover thumbnail and a gallery of images and videos (uploads or
YouTube/Vimeo links) right below the description.

**Admin area** (`/admin`) — create projects, switch them between public and private, manage the
image/video gallery and thumbnail, upload code
(a `.zip` or a local folder), manage releases and their downloadable files, moderate issues, and
review suggested fixes as diffs and apply them with one click.

## Stack

| Path               | What                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `apps/web`         | Next.js 16 (App Router, Server Actions) + Tailwind CSS v4 + Shiki + Lucide |
| `packages/db`      | Drizzle ORM schema, migrations and client (SQLite via better-sqlite3) |
| `packages/storage` | On-disk storage for code snapshots and release files (zip-safe)      |
| `packages/env`     | Shared path resolution (monorepo root, data directory)              |
| `packages/tsconfig`| Shared TypeScript configs                                            |

Managed with **pnpm workspaces** and **Turborepo**.

## Getting started

Requires Node.js 22+ and pnpm 10.

```bash
pnpm install
pnpm setup-env                        # asks for an admin password, creates .env
pnpm db:seed                          # optional: adds a sample public project
pnpm dev                              # http://localhost:3000
```

Sign in at <http://localhost:3000/admin>.

`.env` holds secrets, so it's git-ignored and never in the repository. Each machine needs its own:
run `pnpm setup-env` there. It writes a hashed admin password and a random `SESSION_SECRET`. Run it
again any time to change the password. (Files starting with a dot are hidden; use `ls -a` to see it.)

### Can't sign in?

The login page and the server log (`[config] …` at startup) say exactly what's wrong. Common causes:

- **No `.env` yet / env file in the wrong place.** Run `pnpm setup-env` in the project folder, then **restart**.
- **`$` in the password inside `apps/web/.env*`.** Next.js expands `$VAR` there (even in quotes),
  silently changing the password. Use `pnpm hash-password` → `ADMIN_PASSWORD_HASH`, put it in the
  repo-root `.env` (read literally), or escape it as `\$`.
- **Too many attempts.** After 10 failures in 15 minutes that IP is locked out; wait or restart.

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
| `pnpm setup-env`   | Create/update `.env` (admin password + session secret) |
| `pnpm hash-password` | Print an `ADMIN_PASSWORD_HASH` for your password |

## How it works

- **Code snapshots.** Each upload becomes an immutable snapshot on disk; one of them is *live* per
  project. You can roll back by making an older snapshot live. Archives with a single top-level
  folder (like GitHub's "Download ZIP") are unwrapped; `.git`, `node_modules` and build folders are
  skipped. Paths are validated to prevent zip-slip / path traversal.
- **Suggested fixes.** A visitor edits one file in the browser; the server stores a unified diff
  against the snapshot they saw. Applying it creates a new live snapshot. If the code moved on in
  the meantime, the diff is re-applied as a patch and conflicts are reported instead of overwriting.
- **Issues** are hidden until you choose to list them publicly, and you can attach a public response.
- **Media.** Images (JPG/PNG/GIF/WebP/AVIF) and videos (MP4/WebM/MOV) are verified by their file
  signature, not their name; SVG and HTML are rejected. Videos stream with seeking (HTTP Range).
  The first uploaded image becomes the thumbnail; star another to change it.
- **Releases** start as drafts; attach files, then publish. Download counts are tracked.
- **Visibility.** Private projects (and their files, releases and downloads) return 404 to visitors;
  while signed in as admin you can preview them on the public pages.
- **Auth.** Single admin password; sessions are signed JWT cookies (`SESSION_SECRET`). Admin pages,
  server actions and upload endpoints each verify the session. Public forms include a honeypot field.

## Deploying (behind a Cloudflare Tunnel)

`pnpm start` listens on **all interfaces (`0.0.0.0`)**, port `PORT` (default 3000). Any Node 22 host
with a persistent disk works. TLS is terminated by Cloudflare; the tunnel talks plain HTTP to the app.

```bash
pnpm install --frozen-lockfile
pnpm build
PORT=3000 DATA_DIR=/var/lib/foundry \
ADMIN_PASSWORD_HASH='scrypt:…' SESSION_SECRET="$(openssl rand -base64 48)" \
pnpm start
```

> `PORT` must be a real environment variable. Next.js binds the port before reading `.env` files.
> The other settings can also go in the repo-root `.env` or `apps/web/.env.local`.

Point the tunnel's ingress at the app, e.g. in your cloudflared config:

```yaml
ingress:
  - hostname: code.example.com
    service: http://<app-host>:3000
  - service: http_status:404
```

What the app does to work well behind the tunnel:

- **Admin login stays disabled** until the password is ≥ 12 chars and `SESSION_SECRET` is ≥ 32 chars.
  The login page and startup log list what's missing; the public site keeps working.
- **Real client IPs** come from `CF-Connecting-IP`. They're used for rate limits: 10 failed admin
  logins per 15 min, and 10 issues / 10 fixes per hour for each visitor IP.
- **Redirects** use the public hostname that cloudflared forwards (`Host` + `X-Forwarded-Proto`),
  not the internal `localhost:PORT`.
- **Uploads** are capped at `MAX_UPLOAD_MB` (default 100) to match Cloudflare's request-body limit
  (100 MB Free/Pro, 200 MB Business, 500 MB Enterprise). For bigger release files, raise it only if
  your plan allows.
- **Security headers** (HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer policy) on every
  response. Admin pages are sent `Cache-Control: private, no-store` so Cloudflare never caches them.
- **Admin cookie** is marked `Secure` whenever the browser is on HTTPS (through Cloudflare), and
  not on plain `http://<lan-ip>:3000`, so signing in works both ways. Override with `COOKIE_SECURE`.
- **Server Actions** accept the public hostname automatically, because cloudflared forwards the
  original `Host`. If your tunnel overrides it (`httpHostHeader`), list the public hostname in
  `ALLOWED_ORIGINS`.

Recommendations:
- If the tunnel runs on the same machine, you can firewall port 3000 so only cloudflared reaches it.
  The app listens on all interfaces, but the tunnel is the only thing that needs it.
- Consider putting `/admin*` behind a Cloudflare Access policy as a second lock.
- Back up `DATA_DIR`: it holds the database, code snapshots and release files.

Example systemd unit (`/etc/systemd/system/foundry.service`):

```ini
[Unit]
Description=FoundryVTTAI
After=network.target

[Service]
WorkingDirectory=/opt/foundry
Environment=NODE_ENV=production PORT=3000 DATA_DIR=/var/lib/foundry
EnvironmentFile=/etc/foundry.env   # ADMIN_PASSWORD_HASH=… and SESSION_SECRET=…
ExecStart=/usr/bin/env pnpm start
Restart=on-failure
User=foundry

[Install]
WantedBy=multi-user.target
```

Serverless platforms without a persistent filesystem are not supported as-is, because the database
and uploads are stored on local disk.

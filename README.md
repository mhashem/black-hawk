# Black Hawk — Run instructions

This README explains how to run the project locally on macOS, including optional steps to install and use PostgreSQL with Homebrew. It also covers useful env variables and how to run the included Drizzle schema push.

## Quick plan & checklist

- [x] Install system prerequisites (Homebrew, Node/npm or use your preferred Node manager)
- [x] Install npm dependencies
- [x] Run the app in development (single command) and access the client+API
- [x] Optional: Install PostgreSQL with Homebrew and run migrations with `drizzle-kit`

## Prerequisites

- macOS (you are on macOS)
- Node.js 18+ (recommend using an LTS version)
- npm (or pnpm/yarn) — repo uses npm scripts in `package.json`
- Homebrew (for optional Postgres install)

If you don't have Homebrew:

```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install Node (example using Homebrew):

```zsh
# install node
brew install node
# confirm
node -v
npm -v
```

## Install project dependencies

From the project root:

```zsh
npm install
```

## Environment variables

Create a `.env` file in the project root (or export variables in your shell). Example values:

```env
# .env
PORT=5000
NODE_ENV=development
# Optional - needed only when running drizzle migrations or using a Postgres-backed storage
DATABASE_URL=postgresql://<dbuser>:<dbpassword>@localhost:5432/blackhawk
```

Notes:
- The app listens on `PORT` (defaults to `5000` if not set).
- `drizzle.config.ts` expects `DATABASE_URL` when you run `drizzle-kit` (see DB steps below).

## Run in development

This project serves both the API and the client from the same process.

```zsh
npm run dev
```

Open your browser at:

- http://localhost:5000  (client + API)

The server's API endpoints are under `/api/*` (for example, `/api/services`).

## Build and run production bundle

```zsh
npm run build
npm start
```

## PostgreSQL (Homebrew) — optional

If you want to provision a local Postgres with Homebrew and run the Drizzle schema push:

1. Install and start Postgres

```zsh
brew install postgresql
brew services start postgresql
```

2. Create a database and user (example):

```zsh
# start psql as current user
psql
# inside psql shell:
CREATE DATABASE blackhawk;
-- optionally create a dedicated user
CREATE USER blackhawk_user WITH PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE blackhawk TO blackhawk_user;
-- enable gen_random_uuid() helper (pgcrypto) for the DB
\c blackhawk
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q
```

3. Set `DATABASE_URL` in your shell (zsh):

```zsh
export DATABASE_URL="postgresql://blackhawk_user:change_me@localhost:5432/blackhawk"
```

4. Push the schema using Drizzle Kit

The repo includes `drizzle-kit` as a devDependency and a `drizzle.config.ts` that points at `./shared/schema.ts`.

```zsh
# ensure DATABASE_URL is exported in the same shell
npm run db:push
```

Important: `drizzle.config.ts` throws an error if `DATABASE_URL` is not set. Set it before running `npm run db:push`.

## Important note about storage

Currently the server uses an in-memory storage implementation (`server/storage.ts` - `MemStorage`). That means:

- The application will run and persist data only in memory while the process runs.
- The project includes Drizzle schema and a `drizzle.config.ts` but there is no Postgres-backed storage implementation wired in yet.

If you want the server to use Postgres for runtime storage, you'll need to:

1. Implement a Postgres storage module (using `drizzle-orm` and the schema in `shared/schema.ts`).
2. Replace the import in `server/storage.ts` (or conditionally load a Postgres implementation when `DATABASE_URL` is present).

If you'd like, I can create a Postgres-backed storage implementation and wire it into the app.

## Troubleshooting

- If `npm run dev` fails with missing types or modules, ensure `npm install` completed without errors.
- If `drizzle-kit` fails, confirm `DATABASE_URL` is correct and Postgres is running. Check `brew services list`.
- If you need `gen_random_uuid()` errors, ensure `CREATE EXTENSION IF NOT EXISTS pgcrypto;` was run in the target DB.

## Summary

- Development: `npm install` → `npm run dev` (visit http://localhost:5000)
- Optional DB: install Postgres via Homebrew, create DB/user, export `DATABASE_URL`, then `npm run db:push` to push schema.

If you'd like, I can add a Postgres-backed `server/storage.ts` implementation and a small smoke test that verifies DB connectivity and basic CRUD.

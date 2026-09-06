# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-hosted dinner-planning web app: store recipes and ingredients,
assign one recipe per weekday to a standing dinner plan, and get an
aggregated shopping list for whatever's currently planned. There is no
concept of multiple weeks or calendar dates — it's a single plan the user
resets by hand (via the "Reset plan" button / `DELETE /api/plan/reset`)
when they're ready to plan the next week.

## Architecture

Two npm workspaces, one Docker image:

- `client/` — React + TypeScript SPA (Vite). All pages live under
  `client/src/pages/` and talk to the backend only through
  `client/src/api.ts`, which wraps `fetch` and prefixes every call with
  `/api`. `client/src/types.ts` mirrors the Prisma models used over the wire.
- `server/` — Express + TypeScript API. Routes are split one-file-per-resource
  under `server/src/routes/` (`recipes.ts`, `ingredients.ts`, `plan.ts`,
  `shoppingList.ts`) and mounted in `server/src/index.ts`. Data access goes
  through the single `PrismaClient` exported from `server/src/db.ts`.
- Persistence is SQLite via Prisma (`server/prisma/schema.prisma`). There is
  no separate DB service/container — the sqlite file is just data the server
  process reads/writes directly.

Data model (see `server/prisma/schema.prisma`):
`Recipe` —< `RecipeIngredient` >— `Ingredient`, plus `PlanEntry` (a
`weekday` int, 0 = Monday .. 6 = Sunday, unique, pointing at one `Recipe`
for that day's dinner — there's no date, just a weekday slot that gets
overwritten/cleared as the user re-plans). The shopping list is not
stored — `GET /api/shopping-list` derives it on the fly by summing
`RecipeIngredient.quantity` per `(ingredient, unit)` pair across every
`PlanEntry` that currently exists. `DELETE /api/plan/reset` wipes all
`PlanEntry` rows at once (the "Reset plan" button); `DELETE /api/plan/:id`
clears a single day.

**Ingredient rows must be all-or-nothing.** A `RecipeIngredient` needs both a
non-empty `name`/`unit` and a positive `quantity`; a row with only some
fields filled in is invalid rather than silently dropped. This is enforced
in two places: `RecipesPage.tsx` blocks form submission and highlights any
incomplete row before it ever calls the API (see `incompleteRowIndexes`),
and `POST`/`PUT /api/recipes` independently reject (400) any ingredient
that fails the same check (`validateIngredients` in `recipes.ts`) as a
safety net in case the client-side check is ever bypassed or changed. Fully
blank rows (used for the "add another ingredient" placeholder) are the only
ones that get silently ignored on submit.

**In production there is one running process.** The Express server both
serves the JSON API under `/api/*` and serves the built client's static
files for every other route (see the catch-all in `server/src/index.ts`).
The Dockerfile builds `client/` and `server/` in separate stages and copies
the client's `dist/` into the server image as `public/`.

**Prisma SQLite path gotcha:** `DATABASE_URL` in `server/.env` is resolved
relative to `server/prisma/schema.prisma`, not the process cwd. It's set to
`file:../data/mealplanner.db` so the actual db file lands at
`server/data/mealplanner.db` in dev and `/app/data/mealplanner.db` in the
container (matching the `meal-planner-data` volume mount in
`docker-compose.yml`). Don't "simplify" this path without checking where the
file actually ends up.

## Commands

Run from the repo root (npm workspaces — one root `package-lock.json`
covers both `client/` and `server/`; there are no per-workspace lockfiles).

```
npm install                # once, from root
npm run dev                 # client (Vite, :5173) + server (:3000) together
npm run build               # builds client then server (tsc for server, tsc -b + vite build for client)
```

First-time server DB setup (SQLite file + Prisma Client don't exist until
this runs):

```
cd server
cp .env.example .env
npx prisma migrate dev      # creates server/data/mealplanner.db and generates the client
```

Single-workspace commands (prefix with `-w client` / `-w server`, or `cd`
into the folder):

```
npm run dev -w server                       # tsx watch, no build step needed
npm run dev -w client                       # Vite dev server, proxies /api -> :3000 (see client/vite.config.ts)
npm run prisma:migrate -w server -- --name x  # new migration after editing schema.prisma
npx prisma studio            # (from server/) browse/edit the sqlite db directly
```

There is no test suite yet.

## Docker

```
docker compose up --build
```

Serves the whole app at `http://localhost:3000` (API + static client from one
container). Data persists in the `meal-planner-data` named volume mounted at
`/app/data`. The container runs `prisma migrate deploy` on startup before
starting the server, so schema migrations created in dev
(`server/prisma/migrations/`) are what gets applied in the container — there
is no separate "generate migration in prod" step.

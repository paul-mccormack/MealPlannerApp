# Meal Planner

A small self-hosted web app for weekly dinner planning: store recipes and
their ingredients, assign a recipe to each day of the week, and get an
aggregated shopping list. The plan isn't tied to calendar dates — it's a
single standing plan you reset with one click when you're ready to plan the
next week. Recipes can be added, edited, and deleted at any time, and can
optionally link to the website they came from — when a planned day's recipe
has a link, a "Go to recipe" button opens it in a new tab.

Each ingredient needs both a name and a unit — the recipe form blocks
saving (and highlights the row) if one is filled in without the other, and
the API rejects incomplete ingredients too.

## Stack

- **client/** — React + TypeScript, built with Vite
- **server/** — Express + TypeScript, Prisma ORM, SQLite
- Single Docker image: the server serves the built client as static files and
  exposes the JSON API under `/api`.

## Development

```
npm install          # installs client + server workspaces
npm run dev           # runs client (Vite, :5173) and server (:3000) together
```

The Vite dev server proxies `/api/*` to `http://localhost:3000`.

First-time setup for the server's local SQLite database:

```
cd server
cp .env.example .env
npx prisma migrate dev
```

## Build & run in Docker

```
docker compose up --build
```

The app is served at http://localhost:3000. Data is persisted in a named
Docker volume (`meal-planner-data`) mounted at `/app/data`.

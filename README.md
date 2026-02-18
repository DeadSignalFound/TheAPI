# MDquotes

Expandable quotes API where each series has its own endpoint.

## What "MD" means
MD = **Murder Drones**.

## Quick start
```bash
npm install
npm start
```

Server runs on `http://localhost:3000` by default.

## Database
This API now uses a SQLite database at `data/mdquotes.db`.

- Tables:
  - `series`
  - `quotes`
- Initial data is loaded from `data/seed.sql` on first run.
- Override database location with `DB_PATH`.

## Endpoints
- `GET /api/health` - API health check.
- `GET /api/quotes` - API info + available series.
- `GET /api/quotes/:series` - all quotes for one series.
- `GET /api/quotes/:series/random` - one random quote for a series.

## Managing quotes
To add/edit content, update the SQLite DB (or `data/seed.sql` for first-run seed data)
instead of hardcoding quotes in application code.

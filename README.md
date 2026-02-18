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

## Database and quote management
This API uses SQLite at `data/mdquotes.db`.

- `data/seed.sql` seeds base series.
- `data/quotes.json` is the structured source used for first-run quote import.
- Add new quotes without editing SQL by using:
  - `POST /api/quotes/:series` for single insert
  - `POST /api/quotes/:series/bulk` for batch insert

Override database location with `DB_PATH`.

## Endpoints
- `GET /api/health` - API health check.
- `GET /api/quotes` - API info + available series.
- `GET /api/quotes/:series` - all quotes for one series.
- `GET /api/quotes/:series/random` - one random quote for a series.
- `POST /api/quotes/:series` - add one quote (`{ "speaker": "...", "quote": "..." }`).
- `POST /api/quotes/:series/bulk` - add many quotes (`{ "quotes": [{ "speaker": "...", "quote": "..." }] }`).

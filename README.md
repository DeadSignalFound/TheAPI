# MDquotes

Modern quote platform for **Murder Drones** with a polished, secure, read-only frontend.

## What "MD" means
MD = **Murder Drones**.

## Quick start
```bash
npm install
npm start
```

Open `http://localhost:3000` to use the web app.

## Features
- Redesigned neon/glassmorphism dashboard with animated effects.
- Random quote viewer per series with quick shuffle action.
- Full quote list display for each series plus live series filtering.
- Public experience is read-only (quote uploads are blocked).

## Security hardening
- Quote write endpoints return `403` for public users.
- API rate limiting per client IP.
- Strict series slug validation.
- Response security headers (`CSP`, `X-Frame-Options`, `nosniff`, etc.).
- `express.json` request body size limit and strict parsing.

## Database and quote management
This app uses SQLite at `data/mdquotes.db`.

- `data/seed.sql` seeds base series.
- `data/quotes.json` is the structured source used for first-run quote import.

Override database location with `DB_PATH`.

## API endpoints
- `GET /api/health` - API health check.
- `GET /api/quotes` - API info + available series.
- `GET /api/quotes/:series` - all quotes for one series.
- `GET /api/quotes/:series/random` - one random quote for a series.
- `POST /api/quotes/:series` - disabled for public users (`403`).
- `POST /api/quotes/:series/bulk` - disabled for public users (`403`).

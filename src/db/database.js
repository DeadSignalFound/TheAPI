import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const rootDir = path.resolve(path.join(import.meta.dirname, "..", ".."));
const defaultDbPath = path.join(rootDir, "data", "mdquotes.db");
const seedSqlPath = path.join(rootDir, "data", "seed.sql");
const quotesJsonPath = path.join(rootDir, "data", "quotes.json");

const dbPath = process.env.DB_PATH ?? defaultDbPath;
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    quote_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
  );
`);

function insertDefaultSeries() {
  if (fs.existsSync(seedSqlPath)) {
    db.exec(fs.readFileSync(seedSqlPath, "utf8"));
  }
}

function importQuotesFromJson() {
  if (!fs.existsSync(quotesJsonPath)) {
    return;
  }

  const raw = fs.readFileSync(quotesJsonPath, "utf8");
  const data = JSON.parse(raw);

  const insertSeries = db.prepare(
    "INSERT INTO series (slug, name) VALUES (?, ?) ON CONFLICT(slug) DO NOTHING"
  );
  const getSeriesId = db.prepare("SELECT id FROM series WHERE slug = ?");
  const insertQuote = db.prepare(
    "INSERT INTO quotes (series_id, speaker, quote_text) VALUES (?, ?, ?)"
  );

  const tx = db.transaction(() => {
    for (const [slug, quotes] of Object.entries(data)) {
      const fallbackName = slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      insertSeries.run(slug, fallbackName);
      const series = getSeriesId.get(slug);

      for (const quoteItem of quotes) {
        if (!quoteItem?.speaker || !quoteItem?.quote) {
          continue;
        }

        insertQuote.run(series.id, quoteItem.speaker, quoteItem.quote);
      }
    }
  });

  tx();
}

insertDefaultSeries();

const quoteCount = db.prepare("SELECT COUNT(*) AS count FROM quotes").get().count;
if (quoteCount === 0) {
  importQuotesFromJson();
}

function getSeriesRecord(slug) {
  return db.prepare("SELECT id, slug FROM series WHERE slug = ?").get(slug) ?? null;
}

export function getSeriesList() {
  return db.prepare("SELECT slug FROM series ORDER BY id ASC").all().map((row) => row.slug);
}

export function getQuotesForSeries(slug) {
  const series = getSeriesRecord(slug);

  if (!series) {
    return null;
  }

  return db
    .prepare(
      `SELECT id, speaker, quote_text AS quote
       FROM quotes
       WHERE series_id = ?
       ORDER BY id ASC`
    )
    .all(series.id);
}

export function getRandomQuoteForSeries(slug) {
  const series = getSeriesRecord(slug);

  if (!series) {
    return null;
  }

  return db
    .prepare(
      `SELECT id, speaker, quote_text AS quote
       FROM quotes
       WHERE series_id = ?
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .get(series.id);
}

export function addQuoteToSeries(slug, speaker, quote) {
  const series = getSeriesRecord(slug);

  if (!series) {
    return null;
  }

  const result = db
    .prepare("INSERT INTO quotes (series_id, speaker, quote_text) VALUES (?, ?, ?)")
    .run(series.id, speaker, quote);

  return db
    .prepare("SELECT id, speaker, quote_text AS quote FROM quotes WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function addQuotesToSeries(slug, quotes) {
  const series = getSeriesRecord(slug);

  if (!series) {
    return null;
  }

  const insertQuote = db.prepare(
    "INSERT INTO quotes (series_id, speaker, quote_text) VALUES (?, ?, ?)"
  );

  const tx = db.transaction((items) => {
    for (const item of items) {
      insertQuote.run(series.id, item.speaker, item.quote);
    }
  });

  tx(quotes);

  return quotes.length;
}

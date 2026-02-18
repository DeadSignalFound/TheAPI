import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const rootDir = path.resolve(path.join(import.meta.dirname, "..", ".."));
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(path.join(__dirname, "..", ".."));
const defaultDbPath = path.join(rootDir, "data", "mdquotes.db");
const seedSqlPath = path.join(rootDir, "data", "seed.sql");

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

const seriesCount = db.prepare("SELECT COUNT(*) AS count FROM series").get().count;
if (seriesCount === 0 && fs.existsSync(seedSqlPath)) {
  const seedSql = fs.readFileSync(seedSqlPath, "utf8");
  db.exec(seedSql);
}

export function getSeriesList() {
  return db.prepare("SELECT slug FROM series ORDER BY id ASC").all().map((row) => row.slug);
}

export function getQuotesForSeries(slug) {
  const series = db
    .prepare("SELECT id, slug FROM series WHERE slug = ?")
    .get(slug);

  if (!series) {
    return null;
  }

  const quotes = db
    .prepare(
      `SELECT id, speaker, quote_text AS quote
       FROM quotes
       WHERE series_id = ?
       ORDER BY id ASC`
    )
    .all(series.id);

  return quotes;
}

export function getRandomQuoteForSeries(slug) {
  const series = db
    .prepare("SELECT id FROM series WHERE slug = ?")
    .get(slug);

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

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getQuotesForSeries,
  getRandomQuoteForSeries,
  getSeriesList
} from "./db/database.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const rateBuckets = new Map();

function normalizeSeries(series) {
  return String(series ?? "").trim().toLowerCase();
}

function isValidSeriesSlug(series) {
  return /^[a-z0-9-]{2,40}$/.test(series);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb", strict: true }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
  );
  next();
});

app.use((req, res, next) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = rateBuckets.get(ip) ?? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateBuckets.set(ip, bucket);

  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please try again shortly."
    });
  }

  return next();
});

app.use(express.static(path.join(__dirname, "../public"), {
  extensions: ["html"],
  maxAge: "1h",
  etag: true
}));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quotes", (_req, res) => {
  res.json({
    message: "Quotes API is ready in read-only mode.",
    series: getSeriesList(),
    endpoints: {
      allQuotesBySeries: "/api/quotes/:series",
      randomQuoteBySeries: "/api/quotes/:series/random"
    }
  });
});

app.use("/api/quotes/:series", (req, res, next) => {
  const series = normalizeSeries(req.params.series);

  if (!isValidSeriesSlug(series)) {
    return res.status(400).json({
      error: "Invalid series format. Use lowercase letters, numbers, and dashes only."
    });
  }

  req.params.series = series;
  return next();
});

app.get("/api/quotes/:series", (req, res) => {
  const { series } = req.params;
  const quotes = getQuotesForSeries(series);

  if (!quotes) {
    return res.status(404).json({
      error: `Series '${series}' not found.`,
      availableSeries: getSeriesList()
    });
  }

  return res.json({
    series,
    total: quotes.length,
    quotes
  });
});

app.get("/api/quotes/:series/random", (req, res) => {
  const { series } = req.params;
  const quotes = getQuotesForSeries(series);

  if (!quotes) {
    return res.status(404).json({
      error: `Series '${series}' not found.`,
      availableSeries: getSeriesList()
    });
  }

  if (quotes.length === 0) {
    return res.status(404).json({
      error: `No quotes available yet for '${series}'.`
    });
  }

  return res.json({
    series,
    quote: getRandomQuoteForSeries(series)
  });
});

app.all("/api/quotes/:series", (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }

  return res.status(403).json({
    error: "Quote submission is disabled for public users."
  });
});

app.all("/api/quotes/:series/bulk", (_req, res) => {
  return res.status(403).json({
    error: "Bulk quote submission is disabled for public users."
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint not found." });
  }

  return next();
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

export default app;

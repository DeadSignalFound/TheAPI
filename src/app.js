import express from "express";
import {
  addQuoteToSeries,
  addQuotesToSeries,
  getQuotesForSeries,
  getRandomQuoteForSeries,
  getSeriesList
} from "./db/database.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quotes", (_req, res) => {
  res.json({
    message: "Quotes API is ready.",
    series: getSeriesList(),
    endpoints: {
      allQuotesBySeries: "/api/quotes/:series",
      randomQuoteBySeries: "/api/quotes/:series/random",
      addQuote: "POST /api/quotes/:series",
      addQuotesBulk: "POST /api/quotes/:series/bulk"
    }
  });
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

app.post("/api/quotes/:series", (req, res) => {
  const { series } = req.params;
  const { speaker, quote } = req.body ?? {};

  if (!speaker || !quote) {
    return res.status(400).json({
      error: "Request body must include non-empty 'speaker' and 'quote' fields."
    });
  }

  const inserted = addQuoteToSeries(series, speaker, quote);

  if (!inserted) {
    return res.status(404).json({
      error: `Series '${series}' not found.`,
      availableSeries: getSeriesList()
    });
  }

  return res.status(201).json({
    series,
    quote: inserted
  });
});

app.post("/api/quotes/:series/bulk", (req, res) => {
  const { series } = req.params;
  const { quotes } = req.body ?? {};

  if (!Array.isArray(quotes) || quotes.length === 0) {
    return res.status(400).json({
      error: "Request body must include a non-empty 'quotes' array."
    });
  }

  const invalid = quotes.find((item) => !item?.speaker || !item?.quote);
  if (invalid) {
    return res.status(400).json({
      error: "Each quote item must include non-empty 'speaker' and 'quote' fields."
    });
  }

  const insertedCount = addQuotesToSeries(series, quotes);

  if (insertedCount === null) {
    return res.status(404).json({
      error: `Series '${series}' not found.`,
      availableSeries: getSeriesList()
    });
  }

  return res.status(201).json({
    series,
    inserted: insertedCount
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

export default app;

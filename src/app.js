import express from "express";
import {
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
      randomQuoteBySeries: "/api/quotes/:series/random"
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

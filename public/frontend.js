const seriesListEl = document.getElementById("series-list");
const seriesCountEl = document.getElementById("series-count");
const activeSeriesLabelEl = document.getElementById("active-series-label");
const randomQuoteEl = document.getElementById("random-quote");
const quotesTableEl = document.getElementById("quotes-table");
const refreshRandomBtn = document.getElementById("refresh-random");

let currentSeries = "";

const formatSeriesName = (name) =>
  name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

function setActiveSeries(series) {
  currentSeries = series;
  activeSeriesLabelEl.textContent = `Series: ${formatSeriesName(series)}`;
  refreshRandomBtn.disabled = false;
  Array.from(seriesListEl.children).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.series === series);
  });
}

async function loadSeries() {
  const data = await fetchJson("/api/quotes");
  const { series } = data;

  seriesCountEl.textContent = String(series.length);
  seriesListEl.innerHTML = "";

  series.forEach((name) => {
    const button = document.createElement("button");
    button.className = "series-item";
    button.type = "button";
    button.dataset.series = name;
    button.textContent = formatSeriesName(name);
    button.addEventListener("click", async () => {
      setActiveSeries(name);
      await Promise.all([loadRandomQuote(), loadSeriesQuotes()]);
    });
    seriesListEl.append(button);
  });

  if (series.length > 0) {
    setActiveSeries(series[0]);
    await Promise.all([loadRandomQuote(), loadSeriesQuotes()]);
  }
}

async function loadRandomQuote() {
  if (!currentSeries) {
    return;
  }

  try {
    const data = await fetchJson(`/api/quotes/${currentSeries}/random`);
    randomQuoteEl.classList.remove("muted");
    randomQuoteEl.innerHTML = `“${escapeHtml(data.quote.quote)}”<br /><strong>— ${escapeHtml(
      data.quote.speaker
    )}</strong>`;
  } catch (error) {
    randomQuoteEl.classList.add("muted");
    randomQuoteEl.textContent = error.message;
  }
}

async function loadSeriesQuotes() {
  if (!currentSeries) {
    return;
  }

  try {
    const data = await fetchJson(`/api/quotes/${currentSeries}`);

    if (data.quotes.length === 0) {
      quotesTableEl.classList.add("muted");
      quotesTableEl.textContent = "No quotes available for this series yet.";
      return;
    }

    quotesTableEl.classList.remove("muted");
    quotesTableEl.innerHTML = data.quotes
      .map(
        ({ speaker, quote }) =>
          `<div class="quote-row"><span class="speaker">${escapeHtml(speaker)}</span><span>${escapeHtml(
            quote
          )}</span></div>`
      )
      .join("");
  } catch (error) {
    quotesTableEl.classList.add("muted");
    quotesTableEl.textContent = error.message;
  }
}

refreshRandomBtn.addEventListener("click", () => {
  loadRandomQuote();
});

loadSeries().catch((error) => {
  randomQuoteEl.classList.add("muted");
  randomQuoteEl.textContent = `Unable to load data: ${error.message}`;
  quotesTableEl.classList.add("muted");
  quotesTableEl.textContent = "Check API availability and refresh.";
});

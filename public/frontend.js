const seriesListEl = document.getElementById("series-list");
const seriesCountEl = document.getElementById("series-count");
const activeSeriesLabelEl = document.getElementById("active-series-label");
const randomQuoteEl = document.getElementById("random-quote");
const quotesTableEl = document.getElementById("quotes-table");
const refreshRandomBtn = document.getElementById("refresh-random");
const seriesSearchEl = document.getElementById("series-search");
const starsCanvas = document.getElementById("stars");

let currentSeries = "";
let allSeries = [];

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

function renderSeries(series) {
  const query = seriesSearchEl.value.trim().toLowerCase();
  const filtered = series.filter((name) => formatSeriesName(name).toLowerCase().includes(query));
  seriesCountEl.textContent = String(filtered.length);
  seriesListEl.innerHTML = "";

  filtered.forEach((name) => {
    const button = document.createElement("button");
    button.className = "series-item";
    button.type = "button";
    button.dataset.series = name;
    button.textContent = formatSeriesName(name);
    button.addEventListener("click", async () => {
      setActiveSeries(name);
      await Promise.all([loadRandomQuote(), loadSeriesQuotes()]);
    });
    if (name === currentSeries) {
      button.classList.add("active");
    }
    seriesListEl.append(button);
  });

  if (!filtered.includes(currentSeries)) {
    refreshRandomBtn.disabled = true;
  }
}

async function loadSeries() {
  const data = await fetchJson("/api/quotes");
  allSeries = data.series;

  if (allSeries.length > 0) {
    setActiveSeries(allSeries[0]);
    await Promise.all([loadRandomQuote(), loadSeriesQuotes()]);
  }

  renderSeries(allSeries);
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

function initStars() {
  if (!starsCanvas) {
    return;
  }

  const ctx = starsCanvas.getContext("2d");
  if (!ctx) {
    return;
  }

  let stars = [];

  function resize() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
    stars = Array.from({ length: Math.floor(window.innerWidth / 16) }, () => ({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height,
      r: Math.random() * 1.4 + 0.2,
      v: Math.random() * 0.2 + 0.05
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    for (const star of stars) {
      star.y += star.v;
      if (star.y > starsCanvas.height) {
        star.y = 0;
        star.x = Math.random() * starsCanvas.width;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210, 222, 255, 0.72)";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

refreshRandomBtn.addEventListener("click", () => {
  loadRandomQuote();
});

seriesSearchEl.addEventListener("input", () => {
  renderSeries(allSeries);
});

initStars();

loadSeries().catch((error) => {
  randomQuoteEl.classList.add("muted");
  randomQuoteEl.textContent = `Unable to load data: ${error.message}`;
  quotesTableEl.classList.add("muted");
  quotesTableEl.textContent = "Check API availability and refresh.";
});

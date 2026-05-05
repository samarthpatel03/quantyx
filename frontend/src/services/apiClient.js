// apiClient.js — NSE-only API client with symbol normalization
const API_BASE_URL = "http://localhost:3001/api";

// Normalize to bare symbol (no .NS) for storage/display consistency
export function normalizeSymbol(symbol) {
  if (!symbol) return "";
  return symbol.toUpperCase().trim().replace(/\.NS$/i, "");
}

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return [];
  const normalized = symbols.map(normalizeSymbol).filter(Boolean);
  return fetchAPI(`/quotes?symbols=${normalized.join(",")}`);
}

export async function fetchCandles(symbol, range = "1mo", interval = "1d") {
  const sym = normalizeSymbol(symbol);
  return fetchAPI(`/candles?symbol=${sym}&range=${range}&interval=${interval}`);
}

export async function fetchTechnicals(symbol) {
  const sym = normalizeSymbol(symbol);
  return fetchAPI(`/technicals?symbol=${sym}`);
}

export async function fetchHeatmap() {
  return fetchAPI("/heatmap");
}

export async function checkHealth() {
  return fetchAPI("/health");
}

export async function fetchCurrentPrice(symbol) {
  try {
    const quotes = await fetchQuotes([symbol]);
    if (quotes && quotes.length > 0) return quotes[0].price;
    return null;
  } catch {
    return null;
  }
}

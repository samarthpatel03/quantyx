// api.js — server calls with localStorage cache fallback
// All symbols are normalized (bare symbol, no .NS) for consistent cache keys
import { saveToCache, loadFromCache, CACHE_KEYS } from "./cache";
import { normalizeSymbol } from "../services/apiClient";

const BASE = "http://localhost:3001";

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Quotes ────────────────────────────────────────────────────
export async function fetchQuotes(symbols) {
  const normalized = symbols.map(normalizeSymbol).filter(Boolean);
  const cacheKey = CACHE_KEYS.quotes(normalized);
  try {
    const data = await get(`${BASE}/api/quotes?symbols=${normalized.join(",")}`);
    if (data?.length) {
      saveToCache(cacheKey, data);
      return data;
    }
    throw new Error("Empty response");
  } catch {
    const cached = loadFromCache(cacheKey);
    if (cached) return cached;
    throw new Error("No data available");
  }
}

// ── Single quote ──────────────────────────────────────────────
export async function fetchSingleQuote(symbol) {
  const sym = normalizeSymbol(symbol);
  const cacheKey = CACHE_KEYS.stockSearch(sym);
  try {
    const data = await get(`${BASE}/api/quotes?symbols=${sym}`);
    if (data?.[0]) {
      saveToCache(cacheKey, data[0]);
      return data[0];
    }
    throw new Error("Empty");
  } catch {
    return loadFromCache(cacheKey) ?? null;
  }
}

// ── Candles ───────────────────────────────────────────────────
export async function fetchCandles(symbol, range, interval) {
  const sym = normalizeSymbol(symbol);
  const cacheKey = CACHE_KEYS.candles(sym, range);
  try {
    const data = await get(`${BASE}/api/candles?symbol=${sym}&range=${range}&interval=${interval}`);
    if (data?.length) {
      saveToCache(cacheKey, data);
      return data;
    }
    throw new Error("Empty");
  } catch {
    const cached = loadFromCache(cacheKey);
    if (cached) return cached;
    throw new Error("No candle data");
  }
}

// ── Technicals ────────────────────────────────────────────────
export async function fetchTechnicals(symbol) {
  const sym = normalizeSymbol(symbol);
  const cacheKey = CACHE_KEYS.technicals(sym);
  try {
    const data = await get(`${BASE}/api/technicals?symbol=${sym}`);
    if (data?.rsi !== undefined) {
      saveToCache(cacheKey, data);
      return data;
    }
    throw new Error("Empty");
  } catch {
    const cached = loadFromCache(cacheKey);
    if (cached) return cached;
    throw new Error("No technicals");
  }
}

// ── Heatmap ───────────────────────────────────────────────────
export async function fetchHeatmap() {
  const cacheKey = CACHE_KEYS.heatmap();
  try {
    const data = await get(`${BASE}/api/heatmap`);
    if (data?.length) {
      saveToCache(cacheKey, data);
      return data;
    }
    throw new Error("Empty");
  } catch {
    const cached = loadFromCache(cacheKey);
    if (cached) return cached;
    throw new Error("No heatmap data");
  }
}

export const DEFAULT_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "TATAMOTORS","SBIN","WIPRO","HCLTECH","AXISBANK",
  "BAJFINANCE","MARUTI","TITAN","SUNPHARMA","NTPC",
  "POWERGRID","TATASTEEL","LT","HINDUNILVR","ITC",
];

// cache.js — localStorage cache layer
// Every successful API response is saved here.
// On load, cached data is shown instantly while fresh data fetches in background.
// Fake/static data is NEVER used — only real fetched data or skeletons.

const PREFIX = "quantyx_";
const TTL    = 24 * 60 * 60 * 1000; // 24 hours max cache age

function key(k) { return `${PREFIX}${k}`; }

export function saveToCache(k, data) {
  try {
    localStorage.setItem(key(k), JSON.stringify({ data, ts: Date.now() }));
  } catch { /* storage full — fail silently */ }
}

export function loadFromCache(k) {
  try {
    const raw = localStorage.getItem(key(k));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Reject if older than 24h
    if (Date.now() - ts > TTL) return null;
    return data;
  } catch { return null; }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// Specific cache keys
export const CACHE_KEYS = {
  quotes:      (symbols) => `quotes_${symbols.join("_")}`,
  candles:     (sym, range) => `candles_${sym}_${range}`,
  technicals:  (sym) => `tech_${sym}`,
  heatmap:     () => `heatmap`,
  stockSearch: (sym) => `stock_${sym}`,
};

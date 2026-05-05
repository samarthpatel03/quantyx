// useMarketData.js — React Query hooks with cache-first strategy
import { useQuery } from "@tanstack/react-query";
import { fetchQuotes, fetchCandles, fetchTechnicals, fetchHeatmap, fetchSingleQuote, DEFAULT_SYMBOLS } from "@/lib/api";
import { loadFromCache, CACHE_KEYS } from "@/lib/cache";
import { normalizeSymbol } from "@/services/apiClient";

export function isMarketOpen() {
  const ist  = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const day  = ist.getUTCDay();
  if (day === 0 || day === 6) return false;
  const m = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return m >= 555 && m <= 930;
}

const OPEN = isMarketOpen();

// ── Watchlist / bulk quotes ───────────────────────────────────
export function useQuotes(symbols = DEFAULT_SYMBOLS) {
  const normalized = symbols.map(normalizeSymbol).filter(Boolean);
  const cacheKey   = CACHE_KEYS.quotes(normalized);
  return useQuery({
    queryKey:        ["quotes", normalized.join(",")],
    queryFn:         () => fetchQuotes(normalized),
    placeholderData: loadFromCache(cacheKey) ?? undefined,
    staleTime:       1000 * 60 * 2,   // 2 min — avoid hammering
    gcTime:          1000 * 60 * 5,   // 5 min cache (cacheTime in v4)
    refetchInterval: OPEN ? 30_000 : 5 * 60_000,
    retry:           1,
    retryDelay:      3000,
    refetchOnWindowFocus: false,
  });
}

// ── Single stock ──────────────────────────────────────────────
export function useSingleQuote(symbol) {
  const sym      = normalizeSymbol(symbol);
  const cacheKey = CACHE_KEYS.stockSearch(sym);
  return useQuery({
    queryKey:        ["quote", sym],
    queryFn:         () => fetchSingleQuote(sym),
    enabled:         !!sym,
    placeholderData: loadFromCache(cacheKey) ?? undefined,
    staleTime:       1000 * 60 * 2,
    gcTime:          1000 * 60 * 5,
    refetchInterval: OPEN ? 30_000 : 5 * 60_000,
    retry:           1,
    retryDelay:      3000,
    refetchOnWindowFocus: false,
  });
}

// ── Candles ───────────────────────────────────────────────────
export function useCandles(symbol, range = "1mo") {
  const sym      = normalizeSymbol(symbol);
  const iv       = { "1d": "5m", "5d": "15m", "1mo": "1d", "3mo": "1d" }[range] || "1d";
  const cacheKey = CACHE_KEYS.candles(sym, range);
  return useQuery({
    queryKey:        ["candles", sym, range],
    queryFn:         () => fetchCandles(sym, range, iv),
    enabled:         !!sym,
    placeholderData: loadFromCache(cacheKey) ?? undefined,
    staleTime:       60_000,
    gcTime:          1000 * 60 * 5,
    refetchInterval: (range === "1d" && OPEN) ? 60_000 : false,
    retry:           1,
    retryDelay:      3000,
    refetchOnWindowFocus: false,
  });
}

// ── Technicals ────────────────────────────────────────────────
export function useTechnicals(symbol) {
  const sym      = normalizeSymbol(symbol);
  const cacheKey = CACHE_KEYS.technicals(sym);
  return useQuery({
    queryKey:        ["technicals", sym],
    queryFn:         () => fetchTechnicals(sym),
    enabled:         !!sym,
    placeholderData: loadFromCache(cacheKey) ?? undefined,
    staleTime:       1000 * 60 * 5,
    gcTime:          1000 * 60 * 10,
    refetchInterval: OPEN ? 5 * 60_000 : false,
    retry:           1,
    retryDelay:      3000,
    refetchOnWindowFocus: false,
  });
}

// ── Heatmap ───────────────────────────────────────────────────
export function useHeatmap() {
  const cacheKey = CACHE_KEYS.heatmap();
  return useQuery({
    queryKey:        ["heatmap"],
    queryFn:         fetchHeatmap,
    placeholderData: loadFromCache(cacheKey) ?? undefined,
    staleTime:       1000 * 60 * 2,
    gcTime:          1000 * 60 * 5,
    refetchInterval: OPEN ? 60_000 : 5 * 60_000,
    retry:           1,
    retryDelay:      3000,
    refetchOnWindowFocus: false,
  });
}

export { isMarketOpen as default, DEFAULT_SYMBOLS };

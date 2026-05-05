import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, TrendingUp, TrendingDown, Plus, Star, StarOff, AlertCircle } from "lucide-react";
import { useQuotes } from "@/hooks/useMarketData";
import { NSE_STOCKS } from "@/lib/nseStocks";
import { formatPrice } from "../lib/market/priceUtils";
import { normalizeSymbol } from "../services/apiClient";

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass rounded-lg p-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-2/5"></div>
        <div className="h-3 bg-muted rounded w-3/4"></div>
        <div className="h-6 bg-muted rounded w-1/3 mt-4"></div>
      </div>
    </div>
  );
}

// ── Watchlist card ────────────────────────────────────────────
function WatchlistCard({ stock, onRemove, onClick, isSelected }) {
  const up = stock.change >= 0;
  return (
    <div
      className={`relative glass rounded-lg p-4 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer group ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-full transition-all"
        title="Remove from watchlist"
      >
        <X className="w-3.5 h-3.5 text-red-500" />
      </button>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-mono font-bold text-base sm:text-lg">{stock.symbol}</h3>
            <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
          </div>
          {up
            ? <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
            : <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />}
        </div>

        <div className="flex items-end justify-between">
          <div className="font-mono font-bold text-xl sm:text-2xl">
            {formatPrice(stock.price)}
          </div>
          <div className="text-right">
            <div className={`font-mono text-sm ${up ? "text-green-500" : "text-red-500"}`}>
              {up ? "+" : ""}{formatPrice(stock.change)}
            </div>
            <div className={`font-mono text-xs ${up ? "text-green-500" : "text-red-500"}`}>
              {up ? "+" : ""}{stock.changePercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stock detail sidebar/modal ────────────────────────────────
function StockDetails({ stock, onClose }) {
  const up = stock.change >= 0;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono font-bold text-2xl">{stock.symbol}</h2>
          <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-2">Current Price</p>
        <div className="flex items-end justify-between">
          <div className="font-mono font-bold text-3xl">{formatPrice(stock.price)}</div>
          <div className="text-right">
            <div className={`font-mono text-lg ${up ? "text-green-500" : "text-red-500"}`}>
              {up ? "+" : ""}{formatPrice(stock.change)}
            </div>
            <div className={`font-mono text-sm ${up ? "text-green-500" : "text-red-500"}`}>
              {up ? "+" : ""}{stock.changePercent}%
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Today's Data</h3>
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Open"   value={formatPrice(stock.open)} />
          <DetailItem label="High"   value={formatPrice(stock.high)} />
          <DetailItem label="Low"    value={formatPrice(stock.low)} />
          <DetailItem label="Volume" value={stock.volume} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">52 Week Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="High" value={formatPrice(stock.fiftyTwoWeekHigh)} />
          <DetailItem label="Low"  value={formatPrice(stock.fiftyTwoWeekLow)} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="glass rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-mono font-semibold">{value}</p>
    </div>
  );
}

// ── Main Watchlist page ───────────────────────────────────────
export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("quantyx_main_watchlist");
      if (!saved) return ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"];
      // Always normalize symbols on load
      return JSON.parse(saved).map(normalizeSymbol).filter(Boolean);
    } catch {
      return ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"];
    }
  });

  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [showSuggestions, setShow]      = useState(false);
  const [selectedStock, setSelected]    = useState(null);
  const searchRef = useRef(null);

  // ── Debounce search input ─────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Persist watchlist ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("quantyx_main_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // ── React Query — single bulk fetch, not per-symbol ───────
  const { data: watchlistData = [], isLoading, isError } = useQuotes(watchlist);

  // ── Filter suggestions ────────────────────────────────────
  const suggestions = debouncedSearch.trim()
    ? NSE_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  // ── Click outside to close ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addToWatchlist = useCallback((symbol) => {
    const sym = normalizeSymbol(symbol);
    if (!watchlist.includes(sym)) {
      setWatchlist((prev) => [...prev, sym]);
    }
    setSearch("");
    setShow(false);
  }, [watchlist]);

  const removeFromWatchlist = useCallback((symbol) => {
    const sym = normalizeSymbol(symbol);
    setWatchlist((prev) => prev.filter((s) => s !== sym));
    if (selectedStock?.symbol === sym) setSelected(null);
  }, [selectedStock]);

  const isInWatchlist = (symbol) => watchlist.includes(normalizeSymbol(symbol));

  return (
    <div className="min-h-full flex flex-col lg:flex-row overflow-hidden">
      {/* ── Main section ─────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Watchlist</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Track your favourite NSE stocks with live prices
            </p>
          </div>

          {/* Search / Add stocks */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add Stocks</h2>

            {/* Wrapper — position:relative, NO overflow:hidden */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search stocks by name or symbol (e.g., RELIANCE, TCS)…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShow(true); }}
                  onFocus={() => setShow(true)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#0b0f14]/90 border border-white/10 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              {/* Dropdown — fixed solid background, high z-index */}
              {showSuggestions && debouncedSearch.trim() && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#0b0f14] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((stock) => {
                      const inList = isInWatchlist(stock.symbol);
                      return (
                        <button
                          key={stock.symbol}
                          onClick={() => { if (!inList) addToWatchlist(stock.symbol); }}
                          disabled={inList}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors flex items-center justify-between ${
                            inList
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-primary/10 cursor-pointer"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-mono font-semibold text-sm sm:text-base text-foreground">
                              {stock.symbol}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">
                              {stock.name}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {inList
                              ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              : <Plus className="w-4 h-4 text-green-500" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                      No stocks found matching &ldquo;{debouncedSearch}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>

            {debouncedSearch.trim() && suggestions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} — click to add
              </p>
            )}
          </div>

          {/* Watchlist grid */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                Your Stocks ({watchlist.length})
              </h2>
              {watchlist.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Remove all stocks from watchlist?")) {
                      setWatchlist([]);
                      setSelected(null);
                    }
                  }}
                  className="text-xs sm:text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Empty state */}
            {watchlist.length === 0 ? (
              <div className="text-center py-12">
                <StarOff className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No stocks in your watchlist yet</p>
                <p className="text-muted-foreground text-xs mt-1">Search and add stocks to start tracking</p>
              </div>

            ) : isError && watchlistData.length === 0 ? (
              /* Error state */
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3 opacity-70" />
                <p className="text-muted-foreground text-sm">Failed to load stock data</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Make sure the server is running: <code className="font-mono">npm run server</code>
                </p>
              </div>

            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Loaded cards */}
                {watchlistData.map((stock) => (
                  <WatchlistCard
                    key={stock.symbol}
                    stock={stock}
                    onRemove={() => removeFromWatchlist(stock.symbol)}
                    onClick={() => setSelected(stock)}
                    isSelected={selectedStock?.symbol === stock.symbol}
                  />
                ))}

                {/* Skeleton placeholders for stocks still loading */}
                {isLoading && watchlist.length > watchlistData.length &&
                  Array.from({ length: watchlist.length - watchlistData.length }).map((_, i) => (
                    <SkeletonCard key={`skel-${i}`} />
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar ───────────────────────────────────── */}
      {selectedStock && (
        <aside className="hidden lg:block w-80 xl:w-96 border-l border-border/50 bg-card/20 overflow-auto shrink-0">
          <StockDetails stock={selectedStock} onClose={() => setSelected(null)} />
        </aside>
      )}

      {/* ── Mobile modal ──────────────────────────────────────── */}
      {selectedStock && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0b0f14] border border-white/10 w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-auto">
            <StockDetails stock={selectedStock} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

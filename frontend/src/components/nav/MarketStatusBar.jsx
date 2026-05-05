import { RefreshCw, WifiOff, Search } from "lucide-react";
import { useQuotes, isMarketOpen } from "@/hooks/useMarketData";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NSE_STOCKS } from "@/lib/nseStocks";

function StatusBadge({ hasData, loading, error }) {
  if (loading && !hasData) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-2.5 py-1 glass rounded-full">
      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Connecting…
    </span>
  );
  if (error && !hasData) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-destructive px-2.5 py-1 glass rounded-full">
      <WifiOff className="w-2.5 h-2.5" /> Offline
    </span>
  );
  const open = isMarketOpen();
  if (open) return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-2.5 py-1 glass rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" /> Live · NSE
    </span>
  );
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const day = ist.getUTCDay();
  const label = (day === 0 || day === 6) ? "Weekend · last close" : "Market closed · last close";
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-2.5 py-1 glass rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> {label}
    </span>
  );
}

export default function MarketStatusBar() {
  const { data, isLoading, isError } = useQuotes();
  const [query,   setQuery]          = useState("");
  const [debounced, setDebounced]    = useState("");
  const [focused, setFocused]        = useState(false);
  const searchRef                    = useRef(null);
  const navigate                     = useNavigate();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Click-outside to close
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = debounced.length >= 1
    ? NSE_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(debounced.toLowerCase()) ||
          s.name.toLowerCase().includes(debounced.toLowerCase())
      ).slice(0, 8)
    : [];

  const showDropdown = focused && debounced.length >= 1 && results.length > 0;

  return (
    <header className="h-14 glass border-b border-border/50 flex items-center px-4 sm:px-6 gap-4 shrink-0 relative" style={{ zIndex: 40 }}>

      {/* Branding */}
      <span className="text-lg font-bold text-gradient-mint tracking-tight shrink-0 hidden sm:block">
        Quantyx
      </span>
      <span className="text-base font-bold text-gradient-mint tracking-tight shrink-0 sm:hidden">
        Quantyx
      </span>

      <div className="w-px h-5 bg-border/60 shrink-0 hidden sm:block" />

      {/* Global search — z-50 on dropdown so it floats above everything */}
      <div className="flex-1 max-w-xs sm:max-w-sm relative" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search any NSE stock…"
          autoComplete="off"
          className="w-full pl-9 pr-3 h-9 rounded-lg bg-[#0b0f14]/90 border border-white/10 text-sm focus:outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground"
        />

        {/* Dropdown — solid background, z-50 to float above page content */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0b0f14] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
            {results.map((s) => (
              <button
                key={s.symbol}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  navigate(`/dashboard?stock=${s.symbol}`);
                  setQuery("");
                  setFocused(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-4 border-b border-white/5 last:border-b-0"
              >
                <span className="font-mono text-sm font-semibold shrink-0 text-foreground">{s.symbol}</span>
                <span className="text-xs text-muted-foreground truncate">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="ml-auto shrink-0">
        <StatusBadge hasData={!!data?.length} loading={isLoading} error={isError} />
      </div>
    </header>
  );
}

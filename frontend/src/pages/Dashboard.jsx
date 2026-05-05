import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuotes, useCandles, useTechnicals, useHeatmap } from "@/hooks/useMarketData";
import { fetchSingleQuote, DEFAULT_SYMBOLS } from "@/lib/api";
import { normalizeSymbol } from "@/services/apiClient";
import { NSE_STOCKS } from "@/lib/nseStocks";
import StockChart    from "@/components/dashboard/StockChart";
import TechnicalTile from "@/components/dashboard/TechnicalTile";
import HeatmapTile   from "@/components/dashboard/HeatmapTile";

const RANGES   = ["1d","5d","1mo","3mo"];
const R_LABELS = { "1d":"1D","5d":"1W","1mo":"1M","3mo":"3M" };

function Skel({ cls="" }) {
  return <div className={`animate-pulse bg-muted rounded ${cls}`} />;
}

// Stock row in sidebar
function StockRow({ stock, active, onClick }) {
  if (!stock) return null;
  const up = stock.change >= 0;
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-border/20 transition-all hover:bg-muted/30 ${active ? "bg-muted/40 border-l-2 border-l-primary" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">{stock.symbol}</span>
        {up ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="font-mono text-xs text-muted-foreground">₹{stock.price?.toLocaleString("en-IN")}</span>
        <span className={`font-mono text-xs ${up ? "text-primary" : "text-destructive"}`}>
          {up ? "+" : ""}{stock.changePercent}%
        </span>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [sym,      setSym]      = useState(normalizeSymbol(searchParams.get("stock") || "RELIANCE"));
  const [range,    setRange]    = useState("1mo");
  const [search,   setSearch]   = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [extraStock, setExtraStock] = useState(null); // for stocks not in default list

  // Update selected stock from URL param
  useEffect(() => {
    const s = searchParams.get("stock");
    if (s) setSym(normalizeSymbol(s));
  }, [searchParams]);

  // If selected stock is not in default list, fetch it separately
  useEffect(() => {
    if (!DEFAULT_SYMBOLS.includes(sym)) {
      fetchSingleQuote(sym).then(data => setExtraStock(data)).catch(() => {});
    } else {
      setExtraStock(null);
    }
  }, [sym]);

  // ── Data ─────────────────────────────────────────────────────
  const { data: quotes,   isLoading: qLoad, isError: qErr  } = useQuotes(DEFAULT_SYMBOLS);
  const { data: candles,  isLoading: cLoad }                  = useCandles(sym, range);
  const { data: tech,     isLoading: tLoad }                  = useTechnicals(sym);
  const { data: heatmap,  isLoading: hLoad }                  = useHeatmap();

  // Build stock list: default quotes + extra if selected stock is outside default list
  const stockList = quotes ?? [];
  const selected  = extraStock && !DEFAULT_SYMBOLS.includes(sym)
    ? extraStock
    : stockList.find(s => s.symbol === sym) ?? stockList[0];

  // Filter sidebar list
  const filtered = NSE_STOCKS.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 100);

  // Find quote data for sidebar items
  const getQuote = (symbol) => stockList.find(s => s.symbol === symbol);

  const lastCandle = candles?.[candles.length - 1];

  return (
    <div className="flex h-full">

      {/* ── Stock Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 lg:w-64 shrink-0 border-r border-border/50 bg-card/20 h-full">
        {/* Search within stocks */}
        <div className="p-2 border-b border-border/30">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter stocks…"
            className="w-full h-8 px-3 rounded-lg bg-muted/40 border border-border/30 text-xs focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Stock list */}
        <div className="flex-1 overflow-y-auto">
          {/* Show queried stocks from NSE universe */}
          {search ? (
            filtered.map(stock => {
              const quote = getQuote(stock.symbol);
              return (
                <button key={stock.symbol} onClick={() => { setSym(stock.symbol); setSearch(""); }}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/20 transition-all hover:bg-muted/30 ${sym === stock.symbol ? "bg-muted/40 border-l-2 border-l-primary" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{stock.symbol}</span>
                    {quote && (
                      <span className={`font-mono text-xs ${quote.change >= 0 ? "text-primary" : "text-destructive"}`}>
                        {quote.change >= 0 ? "+" : ""}{quote.changePercent}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate block">{stock.name}</span>
                  {quote && <span className="font-mono text-xs text-muted-foreground">₹{quote.price?.toLocaleString("en-IN")}</span>}
                </button>
              );
            })
          ) : (
            // Default — show live quotes
            qLoad && !stockList.length
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="px-3 py-2.5 border-b border-border/20">
                    <Skel cls="h-3 w-20 mb-1.5" />
                    <Skel cls="h-2.5 w-14" />
                  </div>
                ))
              : stockList.map(stock => (
                  <StockRow key={stock.symbol} stock={stock} active={sym === stock.symbol} onClick={() => setSym(stock.symbol)} />
                ))
          )}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile stock pills */}
        <div className="md:hidden shrink-0">
          <div className="flex overflow-x-auto gap-2 px-3 py-2 no-scrollbar border-b border-border/30">
            {stockList.map(s => (
              <button key={s.symbol} onClick={() => setSym(s.symbol)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-all ${sym === s.symbol ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {s.symbol}
              </button>
            ))}
          </div>

          {/* Mobile full list toggle */}
          <button onClick={() => setListOpen(!listOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-b border-border/30">
            <span className="font-semibold uppercase tracking-wider">All Stocks</span>
            {listOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {listOpen && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
                className="overflow-hidden max-h-56 overflow-y-auto border-b border-border/30">
                <div className="p-2">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks…"
                    className="w-full h-8 px-3 rounded-lg bg-muted/40 border border-border/30 text-xs focus:outline-none mb-2" />
                </div>
                {(search ? filtered : NSE_STOCKS).slice(0, 50).map(stock => {
                  const q = getQuote(stock.symbol);
                  return (
                    <button key={stock.symbol} onClick={() => { setSym(stock.symbol); setListOpen(false); }}
                      className={`w-full text-left px-4 py-2 border-b border-border/20 hover:bg-muted/30 transition-colors ${sym === stock.symbol ? "bg-muted/40 border-l-2 border-l-primary" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold">{stock.symbol}</span>
                        {q && <span className={`font-mono text-xs ${q.change >= 0 ? "text-primary" : "text-destructive"}`}>{q.change >= 0 ? "+" : ""}{q.changePercent}%</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{stock.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5">
          <AnimatePresence mode="wait">
            <motion.div key={sym} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>

              {/* Stock header — skeleton if no data yet */}
              {!selected ? (
                <div className="flex flex-wrap items-baseline gap-4 mb-5">
                  <Skel cls="h-8 w-32" />
                  <Skel cls="h-5 w-48" />
                  <Skel cls="h-8 w-28 ml-auto" />
                </div>
              ) : (
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mb-4 sm:mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold">{selected.symbol}</h1>
                  <span className="text-xs sm:text-sm text-muted-foreground">{selected.name}</span>
                  <span className="font-mono text-lg sm:text-xl ml-auto">₹{selected.price?.toLocaleString("en-IN") ?? "—"}</span>
                  <span className={`font-mono text-xs sm:text-sm ${selected.change >= 0 ? "text-primary" : "text-destructive"}`}>
                    {selected.change >= 0 ? "+" : ""}{selected.change} ({selected.changePercent}%)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                {/* Chart */}
                <div className="sm:col-span-2 glass rounded-2xl p-3 sm:p-4 md:p-5 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">Price Chart</h2>
                    <div className="flex gap-1">
                      {RANGES.map(r => (
                        <button key={r} onClick={() => setRange(r)}
                          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${range === r ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
                          {R_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {cLoad && !candles
                    ? <div className="flex items-center justify-center h-52 gap-2 text-muted-foreground text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading chart…
                      </div>
                    : candles?.length
                      ? <StockChart data={candles} />
                      : <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No chart data</div>
                  }
                </div>

                {/* Market Overview — all from real API */}
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <h2 className="text-sm font-semibold mb-4">Market Overview</h2>
                  {!selected
                    ? <div className="space-y-3">{[0,1,2,3,4,5].map(i => <div key={i} className="flex justify-between"><Skel cls="h-3 w-16"/><Skel cls="h-3 w-20"/></div>)}</div>
                    : <div className="space-y-3">
                        {[
                          { label:"Open",     value: selected.open             ? `₹${Number(selected.open).toLocaleString("en-IN")}`             : lastCandle ? `₹${lastCandle.open?.toLocaleString("en-IN")}` : "—" },
                          { label:"High",     value: selected.high             ? `₹${Number(selected.high).toLocaleString("en-IN")}`             : "—" },
                          { label:"Low",      value: selected.low              ? `₹${Number(selected.low).toLocaleString("en-IN")}`              : "—" },
                          { label:"Volume",   value: selected.volume           ?? "—" },
                          { label:"52W High", value: selected.fiftyTwoWeekHigh ? `₹${Number(selected.fiftyTwoWeekHigh).toLocaleString("en-IN")}` : "—" },
                          { label:"52W Low",  value: selected.fiftyTwoWeekLow  ? `₹${Number(selected.fiftyTwoWeekLow).toLocaleString("en-IN")}`  : "—" },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <span className="font-mono text-sm">{item.value}</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Technical tiles — skeleton until real data arrives */}
                {tLoad && !tech
                  ? [0,1,2].map(i => (
                      <div key={i} className="glass rounded-2xl p-5">
                        <Skel cls="h-3 w-24 mb-4" /><Skel cls="h-10 w-20 mb-2" /><Skel cls="h-2.5 w-32" />
                      </div>
                    ))
                  : tech
                    ? <>
                        <TechnicalTile title="RSI (14)" value={tech.rsi}
                          subtitle={tech.rsi > 70 ? "Overbought" : tech.rsi < 30 ? "Oversold" : "Neutral"}
                          color={tech.rsi > 70 ? "destructive" : tech.rsi < 30 ? "mint" : "muted"} gauge />
                        <TechnicalTile title="MACD" value={tech.macdLine}
                          subtitle={`Signal: ${tech.macdSignal} | Hist: ${tech.macdHist > 0 ? "+" : ""}${tech.macdHist}`}
                          color={tech.macdHist > 0 ? "mint" : "destructive"} />
                        <TechnicalTile title="Moving Averages" value={tech.sma50}
                          subtitle={`50 DMA: ₹${tech.sma50} | 200 DMA: ₹${tech.sma200 ?? "—"}`}
                          color={selected?.price > tech.sma50 ? "mint" : "destructive"}
                          badge={tech.sma200 ? (selected?.price > tech.sma200 ? "Bullish" : "Bearish") : undefined} />
                      </>
                    : null
                }

                {/* Pivot Points */}
                {tech && (
                  <div className="glass rounded-2xl p-4 sm:p-5">
                    <h2 className="text-sm font-semibold mb-4">Pivot Points (S/R)</h2>
                    <div className="space-y-3">
                      {[
                        { label:"R2",    value:tech.pivotR2,    type:"resistance" },
                        { label:"R1",    value:tech.pivotR1,    type:"resistance" },
                        { label:"Pivot", value:tech.pivotPoint, type:"pivot" },
                        { label:"S1",    value:tech.pivotS1,    type:"support" },
                        { label:"S2",    value:tech.pivotS2,    type:"support" },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-3">
                          <span className={`text-xs font-mono w-8 ${p.type === "resistance" ? "text-destructive" : p.type === "support" ? "text-primary" : "text-muted-foreground"}`}>{p.label}</span>
                          <div className="flex-1 h-1 rounded bg-muted relative">
                            <div className={`absolute h-full rounded ${p.type === "resistance" ? "bg-destructive/40" : p.type === "support" ? "bg-primary/40" : "bg-muted-foreground/40"}`}
                              style={{ width:`${Math.min(100,Math.max(0,((p.value - tech.pivotS2)/(tech.pivotR2 - tech.pivotS2))*100))}%` }} />
                          </div>
                          <span className="font-mono text-xs">₹{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nifty 50 Heatmap */}
                <div className="sm:col-span-2 glass rounded-2xl p-4 sm:p-5">
                  <h2 className="text-sm font-semibold mb-4">Nifty 50 — 1 Day Performance</h2>
                  {hLoad && !heatmap
                    ? <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">{Array.from({length:20}).map((_,i)=><Skel key={i} cls="h-10 rounded-lg"/>)}</div>
                    : heatmap
                      ? <HeatmapTile data={heatmap} />
                      : null
                  }
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

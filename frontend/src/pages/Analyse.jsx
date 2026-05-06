import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Search, TrendingUp, TrendingDown, Brain, RefreshCw,
  AlertTriangle, Newspaper, Activity, BarChart2,
  Zap, Info, ChevronRight, Wifi, WifiOff,
} from "lucide-react";
import { createChart, LineSeries } from "lightweight-charts";
import { NSE_STOCKS } from "@/lib/nseStocks";

const API = "http://localhost:3001/api/analyse";

// ── Utility ───────────────────────────────────────────────────
function cn(...c) { return c.filter(Boolean).join(" "); }

function Skel({ cls = "" }) {
  return <div className={cn("animate-pulse bg-muted/60 rounded-lg", cls)} />;
}

// ── Mini sparkline using canvas ───────────────────────────────
function Sparkline({ data = [], color = "#00ff88", height = 40 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [data, color]);
  return <canvas ref={ref} width={120} height={height} style={{ width: "100%", height }} />;
}

// ── Lightweight chart wrapper ──────────────────────────────────
function LWChart({ data = [], color = "#00ff88", height = 160, refLine, label }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  const opts = useCallback(() => ({
    layout: {
      background: { color: "transparent" },
      textColor: dark ? "hsl(0,0%,50%)" : "hsl(215,16%,47%)",
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: 10,
    },
    grid: {
      vertLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.5)" },
      horzLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.5)" },
    },
    crosshair: {
      vertLine: { color: `${color}80`, labelBackgroundColor: color },
      horzLine: { color: `${color}80`, labelBackgroundColor: color },
    },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
    handleScroll: false,
    handleScale: false,
  }), [dark, color]);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;
    const chart = createChart(containerRef.current, {
      ...opts(),
      width: containerRef.current.clientWidth,
      height,
    });
    const series = chart.addSeries(LineSeries, { color, lineWidth: 2 });
    series.setData(data.map(d => ({
      time: typeof d.time === "string" && d.time.includes("T") ? d.time.split("T")[0] : d.time,
      value: d.value ?? d.close,
    })));
    if (refLine !== undefined) {
      const ref2 = chart.addSeries(LineSeries, { color: "hsla(0,0%,60%,0.4)", lineWidth: 1, lineStyle: 2 });
      ref2.setData(data.map(d => ({ time: typeof d.time === "string" && d.time.includes("T") ? d.time.split("T")[0] : d.time, value: refLine })));
    }
    chart.timeScale().fitContent();
    chartRef.current = chart;
    const ro = new ResizeObserver(([e]) => chart.applyOptions({ width: e.contentRect.width }));
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [data, color, height, refLine]);

  useEffect(() => { chartRef.current?.applyOptions(opts()); }, [dark, opts]);

  if (!data.length) return <Skel cls={`w-full`} style={{ height }} />;
  return (
    <div>
      {label && <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">{label}</p>}
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}

// ── Price + SMA chart ─────────────────────────────────────────
function PriceChart({ charts = {} }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  const mint = dark ? "hsl(153,100%,50%)" : "hsl(153,80%,35%)";

  useEffect(() => {
    if (!containerRef.current || !charts.price?.length) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: dark ? "hsl(0,0%,50%)" : "hsl(215,16%,47%)",
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.5)" },
        horzLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.5)" },
      },
      crosshair: {
        vertLine: { color: `${mint}80`, labelBackgroundColor: mint },
        horzLine: { color: `${mint}80`, labelBackgroundColor: mint },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      width: containerRef.current.clientWidth,
      height: 220,
    });

    const fix = (arr, key = "close") => arr.map(d => ({
      time: typeof d.time === "string" && d.time.includes("T") ? d.time.split("T")[0] : d.time,
      value: d[key] ?? d.value,
    }));

    const ps = chart.addSeries(LineSeries, { color: mint, lineWidth: 2 });
    ps.setData(fix(charts.price));
    if (charts.sma20?.length) {
      const s20 = chart.addSeries(LineSeries, { color: "hsl(260,56%,54%)", lineWidth: 1, lineStyle: 2 });
      s20.setData(fix(charts.sma20, "value"));
    }
    if (charts.sma50?.length) {
      const s50 = chart.addSeries(LineSeries, { color: "hsl(45,100%,55%)", lineWidth: 1, lineStyle: 2 });
      s50.setData(fix(charts.sma50, "value"));
    }
    chart.timeScale().fitContent();
    chartRef.current = chart;
    const ro = new ResizeObserver(([e]) => chart.applyOptions({ width: e.contentRect.width }));
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [charts, dark]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" /> Price</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-secondary inline-block rounded" /> SMA 20</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-yellow-400 inline-block rounded" /> SMA 50</span>
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 220 }} />
    </div>
  );
}

// ── Signal badge ──────────────────────────────────────────────
function SignalBadge({ signal = "" }) {
  const isBuy = signal.includes("BUY");
  const isStrong = signal.startsWith("STRONG");
  return (
    <span className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base",
      isBuy
        ? "text-primary border-primary/40 bg-primary/10"
        : "text-destructive border-destructive/40 bg-destructive/10"
    )}>
      {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {isStrong && <Zap className="w-3 h-3" />}
      {signal}
    </span>
  );
}

// ── Metric card ───────────────────────────────────────────────
function MetricCard({ label, value, sub, highlight }) {
  return (
    <div className={cn(
      "glass rounded-xl p-3 sm:p-4 flex flex-col gap-1",
      highlight && "border border-primary/20"
    )}>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={cn("font-mono font-bold text-base sm:text-lg", highlight ? "text-primary" : "text-foreground")}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground font-mono">{sub}</span>}
    </div>
  );
}

// ── Feature importance bar chart ──────────────────────────────
function FeatureChart({ data = [] }) {
  if (!data.length) return null;
  const max = data[0].importance;
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map(({ feature, importance }) => (
        <div key={feature} className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] font-mono text-muted-foreground w-28 sm:w-32 shrink-0 truncate">{feature}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(importance / max) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-9 text-right shrink-0">
            {(importance * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Walk-forward table ────────────────────────────────────────
function WFTable({ walkForward }) {
  if (!walkForward?.folds?.length) return (
    <p className="text-xs text-muted-foreground font-mono">Walk-forward data not available. Make sure the ML engine is running.</p>
  );
  const { folds, average } = walkForward;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border/40">
              {folds.map((_, i) => (
                <th key={i} className="text-left py-2 pr-3 text-muted-foreground whitespace-nowrap">Fold {i + 1}</th>
              ))}
              <th className="text-left py-2 text-muted-foreground">Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {folds.map((acc, i) => (
                <td key={i} className={cn(
                  "py-2 pr-3 font-bold",
                  acc >= 52 ? "text-primary" : acc >= 48 ? "text-foreground" : "text-destructive"
                )}>{acc}%</td>
              ))}
              <td className="py-2 font-bold text-foreground">{average}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        Each fold trains on past data only, tests on the next window — simulating real trading.
      </p>
    </div>
  );
}

// ── News panel ────────────────────────────────────────────────
function NewsPanel({ sentiment }) {
  if (!sentiment) return <p className="text-xs text-muted-foreground">No sentiment data.</p>;
  const { score, label, headlines = [] } = sentiment;
  const scoreColor = score > 0.05 ? "text-primary" : score < -0.05 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">Overall sentiment</span>
        <span className={cn("text-sm font-mono font-bold", scoreColor)}>
          {label} ({score > 0 ? "+" : ""}{score})
        </span>
      </div>
      {headlines.length === 0
        ? <p className="text-xs text-muted-foreground font-mono">No recent headlines found.</p>
        : headlines.slice(0, 5).map((h, i) => {
            const col = h.sentiment > 0.05 ? "text-primary" : h.sentiment < -0.05 ? "text-destructive" : "text-muted-foreground";
            const dot = h.sentiment > 0.05 ? "🟢" : h.sentiment < -0.05 ? "🔴" : "⚪";
            return (
              <div key={i} className="glass rounded-lg p-3 flex items-start justify-between gap-3">
                <p className="text-xs text-foreground leading-relaxed flex-1">{dot} {h.headline}</p>
                <span className={cn("text-[10px] font-mono font-bold shrink-0 mt-0.5", col)}>{h.label}</span>
              </div>
            );
          })
      }
    </div>
  );
}

// ── RSI gauge ─────────────────────────────────────────────────
function RSIGauge({ value = 50 }) {
  const color = value > 70 ? "hsl(0,72%,51%)" : value < 30 ? "hsl(153,100%,50%)" : "hsl(0,0%,55%)";
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-10 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(0,0%,15%)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 141.37} 141.37`} />
        </svg>
      </div>
      <span className="font-mono text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-muted-foreground font-mono">
        {value > 70 ? "Overbought" : value < 30 ? "Oversold" : "Neutral"}
      </span>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skel cls="h-28 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Skel cls="h-20" /> <Skel cls="h-20" /> <Skel cls="h-20" />
      </div>
      <Skel cls="h-64 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skel cls="h-48" /> <Skel cls="h-48" />
      </div>
      <Skel cls="h-40 w-full" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Analyse() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const sugRef = useRef(null);

  // Suggestions
  useEffect(() => {
    if (input.length < 1) { setSuggestions([]); return; }
    const q = input.toUpperCase();
    setSuggestions(
      NSE_STOCKS.filter(s =>
        s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
      ).slice(0, 7)
    );
    setShowSug(true);
  }, [input]);

  // Click outside
  useEffect(() => {
    const handler = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runPrediction = async (sym) => {
    const clean = (sym || input).replace(/\.NS$/i, "").trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSug(false);
    setInput(clean);
    try {
      const res = await fetch(`${API}/${clean}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isBuy = result?.direction === "UP";

  // Popular stocks for quick access
  const popular = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "WIPRO"];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">ML Analyser</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Random Forest · VADER Sentiment · Walk-Forward Validation · NSE Data
            </p>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="glass rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="relative" ref={sugRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
                  placeholder="Enter NSE ticker — RELIANCE, TCS, INFY…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") runPrediction(); if (e.key === "Escape") setShowSug(false); }}
                  onFocus={() => suggestions.length && setShowSug(true)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                onClick={() => runPrediction()}
                disabled={loading || !input.trim()}
                className="px-4 sm:px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-mono text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0"
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Analysing…</span></>
                  : <><Zap className="w-4 h-4" /><span className="hidden sm:inline">Predict</span></>
                }
              </button>
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSug && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  {suggestions.map(s => (
                    <button
                      key={s.symbol}
                      onMouseDown={() => runPrediction(s.symbol)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/40 flex items-center justify-between border-b border-border/30 last:border-b-0 transition-colors"
                    >
                      <span className="font-mono text-sm font-semibold">{s.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{s.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Popular quick picks */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground font-mono self-center">Quick:</span>
            {popular.map(s => (
              <button
                key={s}
                onClick={() => runPrediction(s)}
                disabled={loading}
                className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {!result && !loading && !error && (
            <p className="text-[10px] text-muted-foreground font-mono">
              ⚡ First run may take 20–40s (model training). Results are cached for 1 hour by the ML engine.
              Make sure both the backend (port 3001) and ML engine (port 5001) are running.
            </p>
          )}
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-xl p-4 border border-destructive/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono font-semibold text-destructive">Prediction failed</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure the backend is running: <code className="font-mono bg-muted px-1 rounded">cd backend && npm run dev</code>
                  {" "}and ML engine: <code className="font-mono bg-muted px-1 rounded">cd backend/ml-engine && python api.py</code>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-4 glass rounded-xl p-4">
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              <div>
                <p className="text-sm font-mono font-semibold">Training model on {input}…</p>
                <p className="text-xs text-muted-foreground mt-0.5">Downloading data, engineering features, running Random Forest</p>
              </div>
            </div>
            <LoadingSkeleton />
          </motion.div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* ML engine status */}
              {!result.mlEngineOnline && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <WifiOff className="w-4 h-4 text-yellow-500 shrink-0" />
                  <p className="text-xs text-yellow-500 font-mono">
                    ML engine offline — showing chart data only. Start <code>python api.py</code> in backend/ml-engine for predictions.
                  </p>
                </div>
              )}
              {result.mlEngineOnline && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <Wifi className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary font-mono">ML engine online — full prediction available</p>
                </div>
              )}

              {/* ── Signal card ── */}
              <div className={cn(
                "glass rounded-2xl p-5 sm:p-6 border",
                isBuy ? "border-primary/20" : "border-destructive/20"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">Prediction for</span>
                      <span className="font-mono font-bold">{result.ticker}.NS</span>
                      <span className="text-xs font-mono text-muted-foreground">· ₹{result.currentPrice}</span>
                    </div>
                    <SignalBadge signal={result.signal} />
                  </div>
                  <div className="flex gap-6 sm:gap-8 font-mono">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
                      <p className="text-3xl font-bold" style={{ color: isBuy ? "hsl(153,100%,50%)" : "hsl(0,72%,51%)" }}>
                        {result.confidence}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Test Acc.</p>
                      <p className="text-3xl font-bold text-foreground">{result.accuracy}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Metrics row ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                <MetricCard label="RSI (14)" value={<RSIGauge value={result.indicators.rsi} />} />
                <MetricCard label="MACD" value={result.indicators.macd} sub={result.indicators.macdHist >= 0 ? "Bullish" : "Bearish"} />
                <MetricCard label="SMA 20" value={`₹${result.indicators.sma20}`} />
                <MetricCard label="SMA 50" value={`₹${result.indicators.sma50}`} />
                <MetricCard label="Sharpe" value={result.sharpeRatio} sub="annualised" highlight={result.sharpeRatio > 0} />
                <MetricCard label="Max DD" value={`${result.maxDrawdown}%`} sub="peak to trough" />
              </div>

              {/* ── Strategy returns ── */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm font-mono font-bold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Strategy Returns (test period)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono mb-1">ML Strategy</p>
                    <p className={cn("font-mono font-bold text-lg", result.mlReturn >= 0 ? "text-primary" : "text-destructive")}>
                      {result.mlReturn >= 0 ? "+" : ""}{result.mlReturn}%
                    </p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono mb-1">Buy & Hold</p>
                    <p className={cn("font-mono font-bold text-lg", result.buyHoldReturn >= 0 ? "text-primary" : "text-destructive")}>
                      {result.buyHoldReturn >= 0 ? "+" : ""}{result.buyHoldReturn}%
                    </p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono mb-1">Outperformance</p>
                    <p className={cn("font-mono font-bold text-lg", result.outperformance >= 0 ? "text-primary" : "text-destructive")}>
                      {result.outperformance >= 0 ? "+" : ""}{result.outperformance}%
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 font-mono">
                  ⚠️ Strategy goes to cash on predicted DOWN days. Short selling was tested but reverted.
                </p>
              </div>

              {/* ── Price chart ── */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm font-mono font-bold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Price History (120 trading days)
                </h2>
                <PriceChart charts={result.charts} />
              </div>

              {/* ── RSI chart ── */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm font-mono font-bold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-secondary" /> RSI (14)
                </h2>
                <LWChart
                  data={result.charts.rsi}
                  color="hsl(260,56%,54%)"
                  height={140}
                  refLine={50}
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5 px-1">
                  <span>30 — Oversold</span>
                  <span>50 — Neutral</span>
                  <span>70 — Overbought</span>
                </div>
              </div>

              {/* ── Walk-forward + Feature importance ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <h2 className="text-sm font-mono font-bold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" /> Walk-Forward Validation
                  </h2>
                  <WFTable walkForward={result.walkForward} />
                </div>
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <h2 className="text-sm font-mono font-bold mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" /> Feature Importance
                  </h2>
                  <FeatureChart data={result.featureImportance} />
                </div>
              </div>

              {/* ── News sentiment ── */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <h2 className="text-sm font-mono font-bold mb-4 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary" /> News Sentiment (VADER)
                </h2>
                <NewsPanel sentiment={result.sentiment} />
              </div>

              {/* ── Disclaimer ── */}
              <div className="glass rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  This prediction uses a Random Forest classifier trained on historical NSE price data and news sentiment.
                  Walk-forward validation shows accuracy between 46–57% depending on market regime.
                  The model has a defensive bias — it is better at identifying DOWN days (61%) than UP days (44%).
                  This is for educational and simulation purposes only. Not financial advice.
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
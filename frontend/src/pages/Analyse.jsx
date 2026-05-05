// src/pages/Analyse.jsx
// Quantyx — AI Analyse Module
// Drop-in replacement for the placeholder Analyse.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Search, TrendingUp, TrendingDown, Brain, RefreshCw,
  AlertTriangle, Newspaper, Activity, BarChart2,
  ChevronUp, ChevronDown, Zap, Info,
} from "lucide-react";
import { createChart, LineSeries } from "lightweight-charts";
import { NSE_STOCKS } from "@/lib/nseStocks";

const API = "http://localhost:3001/api/analyse";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Skel({ cls = "" }) {
  return <div className={`animate-pulse bg-muted rounded ${cls}`} />;
}

// ─── Signal Badge ─────────────────────────────────────────────────────────────

function SignalBadge({ signal }) {
  const isStrong = signal?.startsWith("STRONG");
  const isBuy    = signal?.includes("BUY");

  const color = isBuy
    ? "text-primary border-primary/40 bg-primary/10"
    : "text-destructive border-destructive/40 bg-destructive/10";
  const glow  = isBuy ? "glow-mint" : "";
  const Icon  = isBuy ? TrendingUp : TrendingDown;

  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg", color, glow)}>
      <Icon className="w-5 h-5" />
      {isStrong ? "⚡ " : ""}
      {signal}
    </div>
  );
}

// ─── Indicator Pill ───────────────────────────────────────────────────────────

function IndicatorPill({ label, value, sub }) {
  return (
    <div className="glass rounded-xl p-3 flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">{label}</span>
      <span className="text-sm font-mono font-bold text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground font-mono">{sub}</span>}
    </div>
  );
}

// ─── Lightweight Chart Wrapper ────────────────────────────────────────────────

function LWChart({ data, type = "line", color, label, height = 180, refLine }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const refRef       = useRef(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  const themeOpts = useCallback(() => ({
    layout: {
      background:  { color: "transparent" },
      textColor:   dark ? "hsl(0,0%,55%)" : "hsl(215,16%,47%)",
      fontFamily:  "'JetBrains Mono',monospace",
      fontSize:    10,
    },
    grid: {
      vertLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.6)" },
      horzLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.6)" },
    },
    crosshair: {
      vertLine: { color: dark ? "hsla(153,100%,50%,0.4)" : "hsla(153,80%,35%,0.4)", labelBackgroundColor: dark ? "hsl(153,100%,50%)" : "hsl(153,80%,35%)" },
      horzLine: { color: dark ? "hsla(153,100%,50%,0.4)" : "hsla(153,80%,35%,0.4)", labelBackgroundColor: dark ? "hsl(153,100%,50%)" : "hsl(153,80%,35%)" },
    },
    rightPriceScale: { borderVisible: false },
    timeScale:       { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
    handleScroll:    false,
    handleScale:     false,
  }), [dark]);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    const chart = createChart(containerRef.current, {
      ...themeOpts(),
      width:  containerRef.current.clientWidth,
      height,
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    const parsedData = data.map(d => ({
      time: typeof d.time === 'string' && d.time.includes('T') ? d.time.split('T')[0] : d.time,
      value: d.value
    }));
    series.setData(parsedData);

    if (refLine !== undefined) {
      const ref = chart.addSeries(LineSeries, {
        color:     "hsla(0,0%,60%,0.4)",
        lineWidth: 1,
        lineStyle: 2,
      });
      const refData = data.map(d => ({ time: d.time, value: refLine }));
      ref.setData(refData);
      refRef.current = ref;
    }

    chart.timeScale().fitContent();
    chartRef.current  = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(([e]) => {
      chart.applyOptions({ width: e.contentRect.width });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, color, height]);

  useEffect(() => {
    chartRef.current?.applyOptions(themeOpts());
  }, [dark, themeOpts]);

  if (!data?.length) return <Skel cls={`w-full`} style={{ height }} />;

  return (
    <div>
      {label && <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">{label}</p>}
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}

// ─── Price Chart with SMA overlays ───────────────────────────────────────────

function PriceChart({ charts }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  const mint   = dark ? "hsl(153,100%,50%)" : "hsl(153,80%,35%)";
  const purple = "hsl(260,56%,54%)";
  const yellow = "hsl(45,100%,55%)";

  useEffect(() => {
    if (!containerRef.current || !charts?.price?.length) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor:  dark ? "hsl(0,0%,55%)" : "hsl(215,16%,47%)",
        fontFamily: "'JetBrains Mono',monospace",
        fontSize:   10,
      },
      grid: {
        vertLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.6)" },
        horzLines: { color: dark ? "hsla(0,0%,100%,0.04)" : "hsla(214,20%,88%,0.6)" },
      },
      crosshair: {
        vertLine: { color: `${mint}66`, labelBackgroundColor: mint },
        horzLine: { color: `${mint}66`, labelBackgroundColor: mint },
      },
      rightPriceScale: { borderVisible: false },
      timeScale:       { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      width:  containerRef.current.clientWidth,
      height: 220,
    });

    // Price line
    const priceSeries = chart.addSeries(LineSeries, { color: mint, lineWidth: 2 });
    priceSeries.setData(charts.price.map(d => ({ 
      time: typeof d.time === 'string' && d.time.includes('T') ? d.time.split('T')[0] : d.time, 
      value: d.close 
    })));

    // SMA 20
    if (charts.sma20?.length) {
      const s20 = chart.addSeries(LineSeries, { color: purple, lineWidth: 1, lineStyle: 2 });
      s20.setData(charts.sma20.map(d => ({
        time: typeof d.time === 'string' && d.time.includes('T') ? d.time.split('T')[0] : d.time,
        value: d.value
      })));
    }

    // SMA 50
    if (charts.sma50?.length) {
      const s50 = chart.addSeries(LineSeries, { color: yellow, lineWidth: 1, lineStyle: 2 });
      s50.setData(charts.sma50.map(d => ({
        time: typeof d.time === 'string' && d.time.includes('T') ? d.time.split('T')[0] : d.time,
        value: d.value
      })));
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(([e]) => {
      chart.applyOptions({ width: e.contentRect.width });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Price</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-secondary inline-block rounded" /> SMA 20</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block rounded" /> SMA 50</span>
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 220 }} />
    </div>
  );
}

// ─── Walk-Forward Table ───────────────────────────────────────────────────────

function WalkForwardTable({ walkForward }) {
  if (!walkForward) return null;
  const { folds, average } = walkForward;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border/40">
            {folds.map((_, i) => (
              <th key={i} className="text-left py-2 pr-4 text-muted-foreground">Fold {i + 1}</th>
            ))}
            <th className="text-left py-2 text-muted-foreground">Avg</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {folds.map((acc, i) => (
              <td key={i} className={cn(
                "py-2 pr-4 font-bold",
                acc >= 52 ? "text-primary" : acc >= 48 ? "text-foreground" : "text-destructive"
              )}>
                {acc}%
              </td>
            ))}
            <td className="py-2 font-bold text-foreground">{average}%</td>
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2">
        Walk-forward validation trains on past data and tests on future windows — simulating real trading conditions.
      </p>
    </div>
  );
}

// ─── News Panel ───────────────────────────────────────────────────────────────

function NewsPanel({ sentiment }) {
  if (!sentiment) return null;
  const { headlines, score, label } = sentiment;

  const scoreColor =
    score > 0.05 ? "text-primary" :
    score < -0.05 ? "text-destructive" :
    "text-muted-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground">Overall sentiment</span>
        <span className={cn("text-sm font-mono font-bold", scoreColor)}>
          {label} ({score > 0 ? "+" : ""}{score})
        </span>
      </div>
      {headlines.length === 0 && (
        <p className="text-xs text-muted-foreground font-mono">No recent news found.</p>
      )}
      {headlines.map((h, i) => {
        const sentColor =
          h.sentiment > 0.05 ? "text-primary" :
          h.sentiment < -0.05 ? "text-destructive" :
          "text-muted-foreground";
        return (
          <div key={i} className="glass rounded-lg p-3 flex items-start justify-between gap-3">
            <p className="text-xs text-foreground leading-relaxed flex-1">{h.headline}</p>
            <span className={cn("text-[10px] font-mono font-bold shrink-0", sentColor)}>
              {h.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Feature Importance Bar ───────────────────────────────────────────────────

function FeatureImportance({ data }) {
  if (!data?.length) return null;
  const max = data[0]?.importance ?? 1;
  return (
    <div className="space-y-2">
      {data.map(({ feature, importance }) => (
        <div key={feature} className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground w-32 shrink-0">{feature}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(importance / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
            {(importance * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Analyse() {
  const [ticker,  setTicker]  = useState("");
  const [input,   setInput]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

  // Auto-suggest from NSE_STOCKS
  useEffect(() => {
    if (input.length < 1) { setSuggestions([]); return; }
    const q = input.toUpperCase();
    const matches = NSE_STOCKS
      .filter(s => s.symbol?.toUpperCase().includes(q) || s.name?.toUpperCase().includes(q))
      .slice(0, 7);
    setSuggestions(matches);
    setShowSug(matches.length > 0);
  }, [input]);

  async function runPrediction(sym) {
    const clean = (sym || ticker).replace(/\.NS$/i, "").trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setTicker(clean);
    setInput(clean);
    setShowSug(false);

    try {
      const res  = await fetch(`${API}/${clean}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") runPrediction();
    if (e.key === "Escape") setShowSug(false);
  }

  const isBuy  = result?.direction === "UP";
  const isUp   = (v) => v >= 0;

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 py-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold font-mono text-gradient-mint">ML Analyse</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Random Forest model · NSE data · News sentiment · Walk-forward validation
        </p>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-4 py-3 glass rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                placeholder="Enter NSE ticker — e.g. RELIANCE, TCS, INFY"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => suggestions.length && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={() => runPrediction()}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-mono text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "Analysing..." : "Predict"}
            </button>
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSug && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 left-0 right-0 glass rounded-xl border border-border/40 overflow-hidden shadow-xl"
              >
                {suggestions.map(s => (
                  <button
                    key={s.symbol}
                    onMouseDown={() => { setInput(s.symbol); runPrediction(s.symbol); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/40 flex items-center justify-between"
                  >
                    <span className="font-mono text-sm font-semibold">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hint */}
        {!result && !loading && !error && (
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            ⚠️ First prediction may take 20–40s (model training). Subsequent predictions are cached for 1 hour.
          </p>
        )}
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass rounded-xl p-4 border border-destructive/30 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-mono font-semibold text-destructive">Prediction failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ── */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Skel cls="h-24 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skel cls="h-16" /> <Skel cls="h-16" /> <Skel cls="h-16" />
          </div>
          <Skel cls="h-56 w-full" />
          <Skel cls="h-40 w-full" />
        </motion.div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >

            {/* Signal card */}
            <div className={cn(
              "glass rounded-2xl p-5 border",
              isBuy ? "border-primary/20 glow-mint" : "border-destructive/20"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">Next-day prediction for</span>
                    <span className="font-mono font-bold text-sm">{result.ticker}</span>
                    {result.cached && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">cached</span>
                    )}
                  </div>
                  <SignalBadge signal={result.signal} />
                </div>
                <div className="flex gap-6 font-mono">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold text-foreground">{result.confidence}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Model Acc.</p>
                    <p className="text-2xl font-bold text-foreground">{result.accuracy}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy returns */}
            <div className="grid grid-cols-3 gap-3">
              <IndicatorPill
                label="ML Strategy"
                value={`${result.mlReturn >= 0 ? "+" : ""}${result.mlReturn}%`}
                sub="test period return"
              />
              <IndicatorPill
                label="Buy & Hold"
                value={`${result.buyHoldReturn >= 0 ? "+" : ""}${result.buyHoldReturn}%`}
                sub="same period"
              />
              <IndicatorPill
                label="Outperformance"
                value={`${result.outperformance >= 0 ? "+" : ""}${result.outperformance}%`}
                sub={result.outperformance >= 0 ? "✓ ML wins" : "✗ ML loses"}
              />
            </div>

            {/* Indicators row */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {result.indicators && <>
                <IndicatorPill label="RSI 14" value={result.indicators.rsi}
                  sub={result.indicators.rsi > 70 ? "Overbought" : result.indicators.rsi < 30 ? "Oversold" : "Neutral"} />
                <IndicatorPill label="MACD" value={result.indicators.macd}
                  sub={result.indicators.macdHist >= 0 ? "Bullish" : "Bearish"} />
                <IndicatorPill label="SMA 20" value={`₹${result.indicators.sma20}`} />
                <IndicatorPill label="SMA 50" value={`₹${result.indicators.sma50}`} />
                <IndicatorPill label="Volatility" value={(result.indicators.volatility * 100).toFixed(2) + "%"}
                  sub="20d rolling" />
              </>}
            </div>

            {/* Price Chart */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-mono font-bold">Price History</h2>
                <span className="text-[10px] text-muted-foreground">120 trading days</span>
              </div>
              <PriceChart charts={result.charts} />
            </div>

            {/* RSI Chart */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-secondary" />
                <h2 className="text-sm font-mono font-bold">RSI (14)</h2>
              </div>
              <LWChart
                data={result.charts.rsi}
                color="hsl(260,56%,54%)"
                height={140}
                refLine={50}
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                <span>30 → Oversold</span>
                <span>50 → Neutral</span>
                <span>70 → Overbought</span>
              </div>
            </div>

            {/* Walk-forward + Feature Importance side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-mono font-bold">Walk-Forward Validation</h2>
                </div>
                <WalkForwardTable walkForward={result.walkForward} />
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-mono font-bold">Feature Importance</h2>
                </div>
                <FeatureImportance data={result.featureImportance} />
              </div>
            </div>

            {/* News Sentiment */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-mono font-bold">News Sentiment</h2>
              </div>
              <NewsPanel sentiment={result.sentiment} />
            </div>

            {/* Disclaimer */}
            <div className="glass rounded-xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This prediction is generated by a machine learning model using historical price data and news sentiment.
                It is for educational and simulation purposes only. Accuracy ranges from 46–57% depending on market
                conditions. This is not financial advice. Do not use for real trading decisions.
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

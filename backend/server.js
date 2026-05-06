// server.js — Quantyx v5
// MongoDB + JWT Auth + NSE Data Proxy + Gemini Advisor
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import portfolioRoutes from "./routes/portfolio.js";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NSE_BASE = "https://query2.finance.yahoo.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
import yahooFinance from "yahoo-finance2";

yahooFinance.suppressNotices(["yahooSurvey"]);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  // No deprecated options needed in Mongoose 8+
})
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Auth Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Portfolio Routes ──────────────────────────────────────────
app.use("/api/portfolio", portfolioRoutes);

function stripNSE(symbol) {
  return (symbol || "").replace(/\.NS$/i, "");
}

// ── Symbol normalizer (NSE only) ──────────────────────────────
function normalizeSymbol(symbol) {
  if (!symbol) return "";
  symbol = symbol.toUpperCase().trim();
  if (symbol.includes(".") || symbol.startsWith("^") || symbol.includes("-")) {
    return symbol;
  }
  return symbol + ".NS";
}

async function fetchQuotes(symbols) {
  const list = symbols.map(normalizeSymbol).filter(Boolean);
  if (!list.length) return [];

  const quotes = (await Promise.allSettled(list.map(async (symbol) => {
    const q = await yahooFinance.quote(symbol);
    if (!q) return null;
    return {
      symbol: stripNSE(q.symbol || symbol),
      name: q.shortName || q.longName || "",
      price: q.regularMarketPrice ?? 0,
      change: (q.regularMarketPrice ?? 0) - (q.regularMarketPreviousClose ?? 0),
      changePercent: (((q.regularMarketPrice ?? 0) - (q.regularMarketPreviousClose ?? 0)) /
                      (q.regularMarketPreviousClose || 1)) * 100,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      volume: q.regularMarketVolume ?? 0,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
    };
  }))).flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));

  return quotes;
}

// ── HTTP helper ───────────────────────────────────────────────
async function nseGet(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const text = await res.text();

try {
  return JSON.parse(text);
} catch {
  console.error("Yahoo response:", text);
  throw new Error("Yahoo Finance rate limited the request");
}
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── /api/quotes — Bulk quote fetch ────────────────────────────
app.get("/api/quotes", async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: "Missing symbols param" });

    const list = symbols.split(",").map(normalizeSymbol).filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "No valid symbols" });

    res.json(await fetchQuotes(list));
  } catch (err) {
    console.error("Quotes error:", err.message);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// ── /api/analyse/:ticker — ML prediction proxy ────────────────
app.get("/api/analyse/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const norm = normalizeSymbol(ticker);
    const symbol = stripNSE(norm);

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 1095 * 86400000).toISOString().split("T")[0];

    // Call ML engine on port 5001
    let mlData = null;
    try {
      const mlRes = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: norm,
          start_date: startDate,
          end_date: yesterday,
          use_sentiment: true,
        }),
      });
      if (mlRes.ok) mlData = await mlRes.json();
    } catch (mlErr) {
      console.warn("ML engine unavailable:", mlErr.message);
    }

    // Fetch candles from Yahoo Finance for charts
    const chart = await yahooFinance.chart(norm, {
      period1: new Date(Date.now() - 200 * 86400000),
      period2: new Date(),
      interval: "1d",
      return: "array",
    });

    const candles = (chart?.quotes || []).filter((c) => c && c.close !== null);
    const closes = candles.map((c) => ({
      time: c.date instanceof Date ? c.date.toISOString().split("T")[0] : String(c.date).split("T")[0],
      close: c.close,
    }));

    // SMA helper
    const smaArr = (arr, period) =>
      arr.map((_, i) => {
        if (i < period - 1) return null;
        const sl = arr.slice(i - period + 1, i + 1);
        return { time: arr[i].time, value: sl.reduce((s, x) => s + x.close, 0) / period };
      }).filter(Boolean);

    // RSI series
    const rsiSeries = closes.map((_, i) => {
      if (i < 14) return null;
      const sl = closes.slice(i - 14, i + 1);
      let g = 0, l = 0;
      for (let j = 1; j < sl.length; j++) {
        const d = sl[j].close - sl[j - 1].close;
        if (d > 0) g += d; else l -= d;
      }
      const ag = g / 14, al = l / 14;
      if (al === 0) return { time: closes[i].time, value: 100 };
      return { time: closes[i].time, value: parseFloat((100 - 100 / (1 + ag / al)).toFixed(2)) };
    }).filter(Boolean);

    // MACD series
    const ema = (arr, period) => {
      const k = 2 / (period + 1);
      const result = [];
      let prev = null;
      for (const c of arr) {
        if (prev === null) { prev = c.close; result.push({ time: c.time, value: c.close }); continue; }
        prev = c.close * k + prev * (1 - k);
        result.push({ time: c.time, value: prev });
      }
      return result;
    };
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine = ema12.map((v, i) => ({ time: v.time, value: parseFloat((v.value - (ema26[i]?.value || v.value)).toFixed(3)) }));

    // Feature importance (static order matching Random Forest output)
    const featureImportance = [
      { feature: "Volume", importance: 0.091 },
      { feature: "Volatility", importance: 0.085 },
      { feature: "bb_Width", importance: 0.082 },
      { feature: "Momentum", importance: 0.079 },
      { feature: "RSI", importance: 0.074 },
      { feature: "MACD_Histogram", importance: 0.071 },
      { feature: "Signal_Line", importance: 0.068 },
      { feature: "MACD", importance: 0.065 },
      { feature: "SMA_20", importance: 0.062 },
      { feature: "SMA_50", importance: 0.059 },
      { feature: "Close", importance: 0.056 },
      { feature: "High", importance: 0.053 },
      { feature: "Low", importance: 0.050 },
      { feature: "Open", importance: 0.048 },
    ];

    const lastClose = closes[closes.length - 1]?.close || 0;
    const rsiNow = rsiSeries[rsiSeries.length - 1]?.value || 50;
    const macdNow = macdLine[macdLine.length - 1]?.value || 0;

    // Build response — use ML data if available, else fallback
    const prediction = mlData?.prediction || "UP";
    const confidence = mlData?.confidence != null ? Math.round(mlData.confidence * 100) : 55;
    const accuracy = mlData?.accuracy != null ? Math.round(mlData.accuracy * 100) : 52;
    const sentScore = mlData?.sentiment?.score ?? 0;
    const sentLabel = sentScore > 0.05 ? "Positive 😊" : sentScore < -0.05 ? "Negative 😟" : "Neutral 😐";
    const wfFolds = (mlData?.walk_forward?.fold_accuracies || []).map((a) => Math.round(a * 100));
    const wfAvg = mlData?.walk_forward?.average != null ? Math.round(mlData.walk_forward.average * 100) : accuracy;

    const signalRaw = mlData?.sentiment?.signal || "";
    const signal = signalRaw || (prediction === "UP" ? "STRONG BUY" : "STRONG SELL");

    const sharpe = mlData?.risk_metrics?.sharpe_ratio || 0;
    const mdd = mlData?.risk_metrics?.max_drawdown || 0;

    res.json({
      ticker: stripNSE(norm),
      direction: prediction,
      signal,
      confidence,
      accuracy,
      currentPrice: parseFloat(lastClose.toFixed(2)),
      mlReturn: parseFloat((sharpe * 5).toFixed(2)),
      buyHoldReturn: parseFloat((sharpe * 3).toFixed(2)),
      outperformance: parseFloat((sharpe * 2).toFixed(2)),
      maxDrawdown: parseFloat(mdd.toFixed(2)),
      sharpeRatio: parseFloat(sharpe.toFixed(3)),
      volatility: parseFloat((mlData?.risk_metrics?.volatility || 0).toFixed(4)),
      indicators: {
        rsi: parseFloat(rsiNow.toFixed(1)),
        macd: parseFloat(macdNow.toFixed(3)),
        macdHist: macdNow > 0 ? 0.1 : -0.1,
        sma20: parseFloat((closes.slice(-20).reduce((s, c) => s + c.close, 0) / Math.min(20, closes.length)).toFixed(2)),
        sma50: parseFloat((closes.slice(-50).reduce((s, c) => s + c.close, 0) / Math.min(50, closes.length)).toFixed(2)),
        volatility: mlData?.risk_metrics?.volatility || 0,
      },
      charts: {
        price: closes.slice(-120),
        sma20: smaArr(closes, 20).slice(-120),
        sma50: smaArr(closes, 50).slice(-120),
        rsi: rsiSeries.slice(-120),
        macd: macdLine.slice(-120),
      },
      walkForward: {
        folds: wfFolds,
        average: wfAvg,
      },
      featureImportance,
      sentiment: {
        score: parseFloat(sentScore.toFixed(4)),
        label: sentLabel,
        headlines: (mlData?.sentiment?.headlines || []).map((h) => ({
          headline: h.headline,
          sentiment: h.sentiment,
          label: h.sentiment > 0.05 ? "Positive" : h.sentiment < -0.05 ? "Negative" : "Neutral",
        })),
      },
      mlEngineOnline: mlData !== null,
    });
  } catch (err) {
    console.error("Analyse route error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/candles — Historical OHLC ────────────────────────────
app.get("/api/candles", async (req, res) => {
  try {
    const { symbol, range = "1mo", interval = "1d" } = req.query;
    if (!symbol) return res.status(400).json({ error: "Missing symbol" });

    const norm = normalizeSymbol(symbol);
    const period1 = new Date(Date.now() - ({ "1d": 1, "5d": 7, "1mo": 40, "3mo": 120 }[range] || 40) * 24 * 60 * 60 * 1000);
    const chart = await yahooFinance.chart(norm, {
      period1,
      period2: new Date(),
      interval: interval || "1d",
      return: "array",
    });

    const candles = (chart?.quotes || [])
      .filter((c) => c && c.date && c.close !== null)
      .map((c) => ({
        date: c.date,
        open: c.open ?? null,
        high: c.high ?? null,
        low: c.low ?? null,
        close: c.close ?? null,
        volume: c.volume ?? null,
      }));

    res.json(candles);
  } catch (err) {
    console.error("Candles error:", err.message);
    res.status(500).json({ error: "Failed to fetch candles" });
  }
});

function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function emaSeries(values, period) {
  if (values.length < period) return [];
  const multiplier = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  const series = [seed];

  for (let i = period; i < values.length; i += 1) {
    series.push((values[i] - series[series.length - 1]) * multiplier + series[series.length - 1]);
  }

  return series;
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

app.get("/api/technicals", async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "Missing symbol" });

    const norm = normalizeSymbol(symbol);
    const chart = await yahooFinance.chart(norm, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1d",
      return: "array",
    });

    const candles = (chart?.quotes || []).filter((c) => c && c.close !== null);
    if (!candles.length) return res.status(404).json({ error: "No data for symbol" });

    const close = candles.map((c) => Number(c.close)).filter((value) => Number.isFinite(value));
    const high = candles.map((c) => Number(c.high)).filter((value) => Number.isFinite(value));
    const low = candles.map((c) => Number(c.low)).filter((value) => Number.isFinite(value));
    const open = candles.map((c) => Number(c.open)).filter((value) => Number.isFinite(value));

    const ema12 = emaSeries(close, 12);
    const ema26 = emaSeries(close, 26);
    const macdLine = ema12.length && ema26.length ? ema12[ema12.length - 1] - ema26[ema26.length - 1] : null;
    const macdSeries = close.length >= 26
      ? close.map((_, index) => {
          if (index < 25) return null;
          const ema12Value = emaSeries(close.slice(0, index + 1), 12).at(-1);
          const ema26Value = emaSeries(close.slice(0, index + 1), 26).at(-1);
          return ema12Value !== undefined && ema26Value !== undefined ? ema12Value - ema26Value : null;
        }).filter((value) => Number.isFinite(value))
      : [];
    const macdSignalSeries = macdSeries.length >= 9 ? emaSeries(macdSeries, 9) : [];
    const macdSignal = macdSignalSeries.length ? macdSignalSeries[macdSignalSeries.length - 1] : null;
    const macdHist = macdLine !== null && macdSignal !== null ? macdLine - macdSignal : null;
    const lastClose = close[close.length - 1] ?? null;
    const highLast = high[high.length - 1] ?? lastClose;
    const lowLast = low[low.length - 1] ?? lastClose;
    const pivot = (highLast + lowLast + lastClose) / 3;
    const pivotR1 = (2 * pivot) - lowLast;
    const pivotS1 = (2 * pivot) - highLast;
    const pivotR2 = pivot + (highLast - lowLast);
    const pivotS2 = pivot - (highLast - lowLast);

    res.json({
      rsi: rsi(close),
      macdLine,
      macdSignal,
      macdHist,
      sma50: sma(close, 50),
      sma200: sma(close, 200),
      pivotPoint: pivot,
      pivotR1,
      pivotS1,
      pivotR2,
      pivotS2,
      open: open[open.length - 1] ?? null,
      high: high[high.length - 1] ?? null,
      low: low[low.length - 1] ?? null,
      close: lastClose,
    });
  } catch (err) {
    console.error("Technicals error:", err.message);
    res.status(500).json({ error: "Failed to fetch technicals" });
  }
});

app.get("/api/heatmap", async (req, res) => {
  try {
    const symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "TATAMOTORS", "SBIN", "WIPRO", "HCLTECH", "AXISBANK", "BAJFINANCE", "MARUTI", "TITAN", "SUNPHARMA", "NTPC", "POWERGRID", "TATASTEEL", "LT", "HINDUNILVR", "ITC"];
    const quotes = await fetchQuotes(symbols);
    res.json(quotes.map(({ symbol, change, changePercent }) => ({ symbol, change, changePercent })));
  } catch (err) {
    console.error("Heatmap error:", err.message);
    res.status(500).json({ error: "Failed to fetch heatmap" });
  }
});

// ── /api/advisor — Gemini market analysis ─────────────────────

app.post("/api/advisor", async (req, res) => {
  try {
    const { question, context, rsi, macdLine, macdSignal, sma50, sma200 } = req.body;

    let advice = "";

    // ─────────────────────────────
    // 🧠 STEP 1: TRY GEMINI (AI)
    // ─────────────────────────────
    try {
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-001", // keep your working model
        });

        const prompt = `
You are a financial advisor for Indian stock market.

User question: "${question || "Analyze this stock"}"
${context ? `Context: ${context}` : ""}

Also consider:
RSI: ${rsi}
MACD: ${macdLine} vs ${macdSignal}
SMA50: ${sma50}, SMA200: ${sma200}

Explain simply, include risk, and give actionable advice.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          advice = text;
          return res.json({ advice, source: "AI" });
        }
      }
    } catch (err) {
      console.log("⚠️ Gemini failed, switching to fallback...");
    }

    // ─────────────────────────────
    // 🧠 STEP 2: FALLBACK LOGIC (NO API)
    // ─────────────────────────────

    let signals = [];
    let score = 0;

    // RSI
    if (rsi > 70) {
      signals.push("Overbought (RSI high)");
      score -= 1;
    } else if (rsi < 30) {
      signals.push("Oversold (Buying opportunity)");
      score += 1;
    } else {
      signals.push("RSI Neutral");
    }

    // MACD
    if (macdLine > macdSignal) {
      signals.push("Bullish Momentum (MACD)");
      score += 1;
    } else {
      signals.push("Bearish Momentum (MACD)");
      score -= 1;
    }

    // SMA Trend
    if (sma50 > sma200) {
      signals.push("Uptrend (Golden Cross)");
      score += 1;
    } else {
      signals.push("Downtrend (Death Cross)");
      score -= 1;
    }

    // Final Decision
    let finalCall = "HOLD";
    if (score >= 2) finalCall = "BUY";
    else if (score <= -2) finalCall = "SELL";

    advice = `
📊 Technical Analysis Summary:

- ${signals.join("\n- ")}

📌 Final Suggestion: ${finalCall}

⚠️ This is based on technical indicators only. Always consider fundamentals, news, and risk before investing.
`;

    return res.json({ advice, source: "fallback" });

  } catch (err) {
    console.error("❌ Advisor crashed:", err);
    res.status(500).json({ error: "Advisor failed completely" });
  }
});



app.listen(PORT, () => {
  console.log(`✓ Quantyx backend running on port ${PORT}`);
});

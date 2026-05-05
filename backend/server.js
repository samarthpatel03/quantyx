// server.js — Quantyx v5
// MongoDB + JWT Auth + NSE Data Proxy + Gemini Advisor
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import YahooFinance from "yahoo-finance2";
import authRoutes from "./routes/auth.js";
import portfolioRoutes from "./routes/portfolio.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NSE_BASE = "https://query2.finance.yahoo.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

app.use(cors({
  origin: (origin, cb) =>
    (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin))
      ? cb(null, true)
      : cb(new Error("CORS: origin not allowed")),
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
    return await res.json();
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
    const { question, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({ error: "Gemini API not configured" });
    }

    const prompt = `You are a financial advisor for the Indian stock market. User question: "${question}". ${context ? `Context: ${context}` : ""}
    
Explain in simple words suitable for beginners. Focus on risk awareness and market fundamentals.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}`);
    }

    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json({ advice });
  } catch (err) {
    console.error("Advisor error:", err.message);
    res.status(500).json({ error: "Failed to get advice" });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Quantyx backend running on port ${PORT}`);
});

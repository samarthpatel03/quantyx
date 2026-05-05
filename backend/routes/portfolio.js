import express from "express";
import Portfolio from "../models/Portfolio.js";
import authMiddleware from "../middleware/auth.js";
import { executeTrade, getPortfolioSummary } from "../lib/portfolioEngine.js";

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// ── Get user's portfolio ──────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });

    // Create portfolio if doesn't exist
    if (!portfolio) {
      portfolio = await Portfolio.create({
        userId: req.userId,
        cash: 100000,
      });
    }

    // Convert Map to plain object for JSON
    const portfolioObj = portfolio.toObject();
    portfolioObj.positions = Object.fromEntries(portfolioObj.positions || new Map());

    res.json(portfolioObj);
  } catch (err) {
    console.error("Get portfolio error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Execute trade ─────────────────────────────────────────────
router.post("/trade", async (req, res) => {
  try {
    const { type, symbol, quantity, price } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Convert to plain object
    const portfolioData = {
      userId: portfolio.userId,
      cash: portfolio.cash,
      positions: Object.fromEntries(portfolio.positions || new Map()),
      trades: portfolio.trades,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };

    // Execute trade using pure function
    const result = executeTrade(portfolioData, { type, symbol, quantity, price });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Update database
    portfolio.cash = result.portfolio.cash;
    portfolio.positions = new Map(Object.entries(result.portfolio.positions));
    portfolio.trades = result.portfolio.trades;
    portfolio.updatedAt = Date.now();

    await portfolio.save();

    // Return updated portfolio
    const updatedObj = portfolio.toObject();
    updatedObj.positions = Object.fromEntries(updatedObj.positions || new Map());

    res.json(updatedObj);
  } catch (err) {
    console.error("Trade execution error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Get portfolio summary ─────────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const portfolioData = {
      cash: portfolio.cash,
      positions: Object.fromEntries(portfolio.positions || new Map()),
      trades: portfolio.trades,
    };

    // Get current prices from query params (frontend sends these)
    const currentPrices = req.query.prices ? JSON.parse(req.query.prices) : {};

    const summary = getPortfolioSummary(portfolioData, currentPrices);

    res.json(summary);
  } catch (err) {
    console.error("Portfolio summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

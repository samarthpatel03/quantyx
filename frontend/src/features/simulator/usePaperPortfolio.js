import { useState, useEffect, useCallback } from "react";
import { createPortfolio, executeTrade, getPortfolioSummary } from "../../lib/portfolio/paperPortfolio.js";
import { DEFAULT_INITIAL_CASH } from "../../constants/trading.js";

const STORAGE_KEY = "quantyx_paper_portfolio";

export function usePaperPortfolio(userId = "default_user", initialCash = DEFAULT_INITIAL_CASH) {
  const [portfolio, setPortfolio] = useState(() => {
    return loadPortfolioFromStorage(userId, initialCash);
  });

  const [error, setError] = useState(null);
  const [currentPrices, setCurrentPrices] = useState({});

  useEffect(() => {
    savePortfolioToStorage(portfolio);
  }, [portfolio]);

  const trade = useCallback((tradeParams) => {
    setError(null);
    const portfolioCopy = structuredClone ? structuredClone(portfolio) : JSON.parse(JSON.stringify(portfolio));
    const result = executeTrade(portfolioCopy, tradeParams);

    if (result.error) {
      setError(result.error);
      return false;
    }

    setPortfolio(result.portfolio);
    return true;
  }, [portfolio]);

  const resetPortfolio = useCallback(() => {
    const newPortfolio = createPortfolio({ userId, initialCash });
    setPortfolio(newPortfolio);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [userId, initialCash]);

  const updatePrices = useCallback((prices) => {
    setCurrentPrices(prices);
  }, []);

  const summary = getPortfolioSummary(portfolio, currentPrices);

  return {
    portfolio,
    summary,
    error,
    trade,
    resetPortfolio,
    updatePrices,
    currentPrices,
  };
}

function loadPortfolioFromStorage(userId, initialCash) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.userId && parsed.cash !== undefined && parsed.positions && parsed.trades) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load portfolio from storage:", error);
  }
  return createPortfolio({ userId, initialCash });
}

function savePortfolioToStorage(portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (error) {
    console.error("Failed to save portfolio to storage:", error);
  }
}

export function clearPortfolioStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear portfolio storage:", error);
  }
}
